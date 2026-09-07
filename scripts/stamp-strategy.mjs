#!/usr/bin/env node
/**
 * Carimba na estratégia o estado de automação de cada caso — de API e unitário.
 *
 * O HTML da estratégia é escrito por quem desenha os casos; quem sabe se o caso
 * foi automatizado é o disco deste projeto. Sem o carimbo, quem lê o relatório
 * não tem como saber — e a pergunta "isso está automatizado?" só era respondível
 * abrindo `docs/plans/mapa-casos-api.md`, que é documento de automação, não de
 * estratégia.
 *
 * O selo entra na célula do ID, logo abaixo dele, num `<span class="auto">`. É
 * região gerada: o próximo carimbo sobrescreve, e `build-strategy-json.mjs`
 * descarta o span ao ler o ID.
 *
 * Quatro estados, e a diferença entre eles é o ponto:
 *
 *   automatizado    — existe arquivo de teste
 *   coberto por X   — a verificação vive no arquivo de outro caso
 *   não verificável — descrito e impossível contra o contrato atual
 *   pendente        — falta escrever
 *
 * A camada de API é conferida contra o disco DESTE repo (os specs pactum). A
 * camada unitária é conferida contra a árvore `__tests__/unit/` do repo de
 * desenvolvimento, varrida por `lib/varre-testes-unitarios.mjs` — o mesmo
 * insumo que `build-unit-map.mjs` consome.
 *
 * Uso: node scripts/stamp-strategy.mjs [raiz-do-dev.CrossHub]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { resolveRaizDev } from "./lib/repo-dev.mjs"
import { varrer } from "./lib/varre-testes-unitarios.mjs"

const ROOT = resolve(import.meta.dirname, "..")
const HTML = resolve(ROOT, ".doc/dashboard/estrategia-testes-dashboard.html")
const JSON_ESTRATEGIA = resolve(
	ROOT,
	".doc/dashboard/estrategia-testes-dashboard.json",
)

/** Prefixo do ID do caso -> pasta de domínio. Espelha `build-case-map.mjs`. */
const DOMAIN_BY_MODULE = {
	AG: "appointments",
	F: "forms",
	LGPD: "privacy",
	C: "people",
	H: "dashboard",
	G: "groups",
	CAT: "catalog",
	MK: "branding",
	BN: "banners",
	MN: "dashboard",
	AN: "privacy",
	ANL: "analytics",
}

/** Caso cuja verificação vive no arquivo de outro. Espelha `build-case-map.mjs`. */
const COBERTO_POR = {
	"API-AN-02": "API-AN-01",
	// A rota antiga de indicadores saiu do contrato; o gate vive agora em ANL-03.
	"API-AG-30": "API-ANL-03",
}


const estrategia = JSON.parse(readFileSync(JSON_ESTRATEGIA, "utf8"))
const casos = estrategia.casos
const casosUnit = estrategia.casosUnit ?? []
let html = readFileSync(HTML, "utf8")

/*
 * A árvore de testes do repo de desenvolvimento é insumo OBRIGATÓRIO aqui.
 *
 * Diferente de `build-unit-map.mjs`, que pula com aviso quando não encontra a
 * clonagem irmã, o carimbo se recusa a rodar: escrever "pendente" em 46 linhas
 * porque o repo não estava no lugar seria gravar um falso negativo dentro da
 * própria fonte de verdade — e commitá-lo. O portão pode pular; o carimbo, não.
 */
const dev = resolveRaizDev()
if (casosUnit.length && !dev.disponivel) {
	console.error(`✗ árvore de testes não encontrada em ${dev.raiz} (sentinela: ${dev.sentinela})`)
	console.error("  O carimbo não roda sem ela: marcaria os casos unitários como pendentes por engano.")
	process.exit(1)
}
const varredura = casosUnit.length ? varrer(dev.raiz) : { porId: new Map() }

const contagem = { automatizado: 0, coberto: 0, naoVerificavel: 0, pendente: 0 }
const contagemUnit = { automatizado: 0, naoVerificavel: 0, pendente: 0 }

function selo(testCase) {
	const domain = DOMAIN_BY_MODULE[testCase.modulo]
	const arquivo = `${testCase.id.replace(/^API-/, "")}-F.test.ts`
	const rel = `${domain}/tests/functional/${arquivo}`

	if (domain && existsSync(resolve(ROOT, rel))) {
		contagem.automatizado += 1
		return `<span class="auto"><span class="pill pass">automatizado</span><small>${arquivo}</small></span>`
	}

	const cobertoPor = COBERTO_POR[testCase.id]
	if (cobertoPor) {
		contagem.coberto += 1
		return `<span class="auto"><span class="pill info">coberto por ${cobertoPor}</span></span>`
	}

	if (testCase.naoVerificavel) {
		contagem.naoVerificavel += 1
		return `<span class="auto"><span class="pill warn">não verificável</span></span>`
	}

	contagem.pendente += 1
	return `<span class="auto"><span class="pill fail">pendente</span></span>`
}

/*
 * Selo de um caso unitário.
 *
 * Um `describe` que declara três IDs deixa os três `automatizado` — não
 * "coberto por", porque a verificação de cada um está literalmente ali, no
 * mesmo bloco. "Coberto por" descreveria uma indireção que não existe.
 */
function seloUnit(caso) {
	const ocorrencias = varredura.porId.get(caso.id) ?? []
	if (ocorrencias.length) {
		contagemUnit.automatizado += 1
		const arquivos = [...new Set(ocorrencias.map((oc) => oc.arquivo.split("/").pop()))]
		return `<span class="auto"><span class="pill pass">automatizado</span><small>${arquivos.join(" · ")}</small></span>`
	}
	if (caso.naoVerificavel) {
		contagemUnit.naoVerificavel += 1
		return `<span class="auto"><span class="pill warn">não verificável</span></span>`
	}
	contagemUnit.pendente += 1
	return `<span class="auto"><span class="pill fail">pendente</span></span>`
}

/**
 * Reescreve a célula do ID de um caso, com o selo passado.
 *
 * A célula é RECONSTRUÍDA, não limpa por regex.
 *
 * A limpeza anterior era `replace(/<span class="auto">.*?<\/span>/gs, "")`,
 * non-greedy — e o selo tem um `</span>` aninhado
 * (`<span class="auto"><span class="pill pass">…</span><small>…</small></span>`).
 * O match parava no primeiro fechamento e deixava `<small>…</small></span>`
 * órfão na célula, com uma tag desbalanceada. Consequência medida: em 157 das
 * 167 células o ID virou `API-AG-01 AG-01-F.test.ts` no JSON, e o mapa passou a
 * reportar 94 casos P0 "sem teste" que existiam no disco.
 *
 * O conteúdo legítimo da célula é o ID e mais nada — o resto é região gerada.
 * Reconstruir é idempotente e conserta as células já corrompidas na primeira
 * passada, em vez de exigir uma migração à parte.
 */
function carimba(id, marcaSelo) {
	const marca = `<td class="id">${id}`
	const i = html.indexOf(marca)
	if (i === -1) {
		console.error(`${id}: célula de ID não encontrada no HTML`)
		process.exitCode = 1
		return
	}
	const fim = html.indexOf("</td>", i)
	html = html.slice(0, i) + marca + marcaSelo + html.slice(fim)
}

for (const testCase of casos) carimba(testCase.id, selo(testCase))

for (const caso of casosUnit) carimba(caso.id, seloUnit(caso))

writeFileSync(HTML, html)

console.log(
	`${casos.length} casos de API carimbados · ${contagem.automatizado} automatizados · ` +
		`${contagem.coberto} cobertos por outro · ${contagem.naoVerificavel} não verificáveis · ` +
		`${contagem.pendente} pendentes`,
)
if (casosUnit.length) {
	console.log(
		`${casosUnit.length} casos unitários carimbados · ${contagemUnit.automatizado} automatizados · ` +
			`${contagemUnit.naoVerificavel} não verificáveis · ${contagemUnit.pendente} pendentes`,
	)
}
