#!/usr/bin/env node
/**
 * Carimba na estratégia o estado de automação de cada caso de API.
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
 * Uso: node scripts/stamp-strategy.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

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
}

/** Caso cuja verificação vive no arquivo de outro. Espelha `build-case-map.mjs`. */
const COBERTO_POR = {
	"API-AN-02": "API-AN-01",
}

const RE_SELO = /<span class="auto">.*?<\/span>/gs

const casos = JSON.parse(readFileSync(JSON_ESTRATEGIA, "utf8")).casos
let html = readFileSync(HTML, "utf8")

const contagem = { automatizado: 0, coberto: 0, naoVerificavel: 0, pendente: 0 }

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

for (const testCase of casos) {
	const marca = `<td class="id">${testCase.id}`
	const i = html.indexOf(marca)
	if (i === -1) {
		console.error(`${testCase.id}: célula de ID não encontrada no HTML`)
		process.exitCode = 1
		continue
	}
	const fim = html.indexOf("</td>", i)
	const celula = html.slice(i, fim).replace(RE_SELO, "")
	html = html.slice(0, i) + celula + selo(testCase) + html.slice(fim)
}

writeFileSync(HTML, html)

console.log(
	`${casos.length} casos carimbados · ${contagem.automatizado} automatizados · ` +
		`${contagem.coberto} cobertos por outro · ${contagem.naoVerificavel} não verificáveis · ` +
		`${contagem.pendente} pendentes`,
)
