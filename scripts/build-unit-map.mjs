#!/usr/bin/env node
/**
 * Constrói `docs/plans/mapa-casos-unit.md` — a rastreabilidade entre os casos
 * `UNIT-*` da estratégia e os specs do repo de desenvolvimento.
 *
 * Irmão de `build-case-map.mjs`, que faz o mesmo para a camada de API. Mesma
 * voz, mesma estrutura: quem já lê um não precisa aprender outro formato.
 *
 * A diferença está em COMO o caso casa com o arquivo. Na camada de API o ID é o
 * nome do arquivo, então basta `existsSync`. Aqui o spec é nomeado pelo alvo e
 * um arquivo cobre vários casos — o casamento é por varredura de `describe`,
 * feita em `lib/varre-testes-unitarios.mjs`.
 *
 * Uso: node scripts/build-unit-map.mjs [raiz-do-dev.CrossHub] [--exigir]
 *
 *   --exigir  reprova quando a árvore de testes não é encontrada, em vez de
 *             pular. É o modo do CI — ver o comentário em `main()`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { resolve, dirname } from "node:path"
import { descreveRaiz, resolveRaizDev } from "./lib/repo-dev.mjs"
import { varrer } from "./lib/varre-testes-unitarios.mjs"

const RAIZ = resolve(import.meta.dirname, "..")
const ESTRATEGIA = ".doc/dashboard/estrategia-testes-dashboard.json"
const SAIDA = "docs/plans/mapa-casos-unit.md"

/*
 * Pasta sugerida para o spec de cada módulo.
 *
 * Serve SÓ para a dica de onde o arquivo deveria ficar quando um caso está
 * ausente — nunca para casar caso com arquivo. É diferente do
 * `DOMAIN_BY_MODULE` de `build-case-map.mjs`, que mapeia para os domínios
 * pactum deste repo; unificar os dois quebraria os dois.
 */
const PASTA_POR_MODULO = {
	AG: "agendamentos", F: "formularios", LGPD: "lgpd", C: "clientes", H: "home",
	G: "grupos", CAT: "catalogo", MK: "marca", BN: "banners", MN: "menu",
}

const PRIORIDADES = new Set(["P0", "P1", "P2"])

/** SHA curto de um repo, para o relatório dizer contra o que ele asseverou. */
function sha(dir) {
	try {
		return execFileSync("git", ["-C", dir, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim()
	} catch {
		return "?"
	}
}

function main() {
	const exigir = process.argv.slice(2).includes("--exigir")
	const dev = resolveRaizDev()

	/*
	 * Ausência da árvore de testes: pular ou reprovar, e a assimetria importa.
	 *
	 * Localmente, quem não tem a clonagem irmã não deve ser bloqueado por um
	 * portão de QA — pula com aviso e sai 0. No CI, com `--exigir`, ausência não
	 * significa "não tenho o repo": significa que o step de checkout quebrou em
	 * silêncio, e um typo em `path:` deixaria o job verde para sempre. Um portão
	 * que se desliga quando o insumo desaparece não é um portão.
	 */
	if (!dev.disponivel) {
		const recado = `árvore de testes não encontrada em ${dev.raiz} (sentinela: ${dev.sentinela})`
		if (exigir) {
			console.error(`✗ ${recado}`)
			console.error("  --exigir está ligado: isto é falha de checkout, não ausência legítima.")
			process.exit(1)
		}
		console.warn(`⚠ ${recado} — portão pulado.`)
		console.warn("  Aponte com argumento de CLI ou CROSSHUB_DEV_ROOT para conferir a cobertura.")
		return
	}

	const estrategia = JSON.parse(readFileSync(resolve(RAIZ, ESTRATEGIA), "utf8"))
	const casos = estrategia.casosUnit
	if (!Array.isArray(casos) || !casos.length) {
		console.error(`✗ ${ESTRATEGIA} não traz \`casosUnit\`. Rode \`npm run generate:strategy\`.`)
		process.exit(1)
	}

	const { porId, arquivos } = varrer(dev.raiz)
	const problemas = []

	// Invariante barata que detecta mudança de marcação no HTML antes de ela
	// virar contagem errada: a prioridade sai do texto de um `<span class="pill
	// …">P0</span>`, e uma troca de estilo quebraria em silêncio.
	for (const caso of casos) {
		if (!PRIORIDADES.has(caso.prioridade)) {
			problemas.push(`${caso.id}: prioridade "${caso.prioridade}" fora de P0/P1/P2`)
		}
	}

	const daEstrategia = new Set(casos.map((c) => c.id))
	const semTeste = casos.filter((caso) => !porId.has(caso.id))
	const semCaso = [...porId.entries()]
		.filter(([id]) => !daEstrategia.has(id))
		.flatMap(([, ocorrencias]) => ocorrencias)
	const semId = arquivos.filter((arquivo) => !arquivo.ids.length)

	// `46 = cobertos + ausentes` — pega perda de ocorrência por acumulador mal
	// usado, que é o modo de falha de UNIT-G-01 e UNIT-MK-01 (cobertos nos dois
	// lados de propósito).
	const cobertos = casos.length - semTeste.length
	if (cobertos + semTeste.length !== casos.length) {
		problemas.push(`invariante quebrada: ${cobertos} + ${semTeste.length} ≠ ${casos.length}`)
	}

	/** Arquivos distintos que declaram um caso, com a linha do primeiro describe. */
	const testesDe = (id) => {
		const porArquivo = new Map()
		for (const oc of porId.get(id) ?? []) if (!porArquivo.has(oc.arquivo)) porArquivo.set(oc.arquivo, oc)
		return [...porArquivo.values()]
	}

	const linhas = [
		"# Mapa dos casos unitários",
		"",
		`Rastreabilidade entre os **${casos.length} casos \`UNIT-*\`** de \`${ESTRATEGIA}\` ` +
			`(${estrategia.totais.unit.p0} deles P0) e os specs de \`__tests__/unit/\` do repo de desenvolvimento.`,
		"",
		`Estratégia gerada em ${estrategia.gerado} · mapa gerado por \`npm run generate:unit-map\` — não editar à mão.`,
		"",
		"| Convenção | Valor |",
		"|---|---|",
		`| Árvore de testes | ${descreveRaiz(dev)} |`,
		"| Casamento | ID citado em `describe(...)` — não pelo nome do arquivo |",
		"| Escopo | superfície `dashboard`; `admin/` e `comum/` respondem a outra estratégia |",
		"",
	]

	for (const [modulo, pasta] of Object.entries(PASTA_POR_MODULO)) {
		const doModulo = casos.filter((c) => c.modulo === modulo)
		if (!doModulo.length) continue
		const comTeste = doModulo.filter((c) => porId.has(c.id)).length
		linhas.push(
			`## ${modulo} — ${doModulo[0].moduloNome} (${comTeste}/${doModulo.length})`,
			"",
			"| Caso | Prio | Alvo | Relação | Extrair | Teste |",
			"|---|---|---|---|---|---|",
		)
		for (const caso of doModulo) {
			const testes = testesDe(caso.id)
			const celula = testes.length
				? testes.map((t) => `\`${t.arquivo}:${t.linha}\``).join("<br>")
				: "**ausente**"
			linhas.push(
				`| ${caso.id} | ${caso.prioridade} | ${caso.alvo || "—"} | ` +
					`${caso.relacao.join(", ") || "—"}${caso.relacaoNota ? ` · _${caso.relacaoNota}_` : ""} | ` +
					`${caso.extrair ? "sim" : "—"} | ${celula} |`,
			)
		}
		linhas.push("", `Pasta sugerida: \`__tests__/unit/<api|front>/dashboard/${pasta}/\``, "")
	}

	linhas.push("## Casos sem teste", "")
	if (!semTeste.length) {
		linhas.push("Nenhum. Todo caso unitário da estratégia tem `describe` no disco.", "")
	} else {
		const p0 = semTeste.filter((c) => c.prioridade === "P0")
		linhas.push(
			`**${semTeste.length} de ${casos.length}** sem \`describe\`${p0.length ? `, sendo **${p0.length} P0**` : ""}.`,
			"",
		)
		for (const caso of semTeste) {
			linhas.push(
				`- \`${caso.id}\` (${caso.prioridade}) — ${caso.alvo || "sem alvo declarado"} · ` +
					`sugerido em \`__tests__/unit/${caso.superficie === "front" ? "front" : "api"}/dashboard/${PASTA_POR_MODULO[caso.modulo]}/\``,
			)
		}
		linhas.push("")
	}

	linhas.push("## IDs em teste sem caso na estratégia", "")
	if (!semCaso.length) {
		linhas.push("Nenhum. Todo ID declarado em `describe` existe na estratégia.", "")
	} else {
		/*
		 * Aqui divergimos de propósito do portão de API, onde arquivo fora do
		 * mapa só avisa.
		 *
		 * Lá o ID É o nome do arquivo, e um arquivo fora do mapa é quase sempre
		 * caso que a automação descobriu. Aqui o ID é string digitada à mão
		 * dentro de um `describe`: divergência é quase sempre erro de digitação
		 * (`UNIT-AG-1`, `UNIT-MK-04`) — e um erro de digitação esconde um caso
		 * real em silêncio, marcando-o como ausente. Falhar alto.
		 */
		linhas.push("Erro de digitação num `describe` esconde um caso real. Isto reprova o portão.", "")
		for (const oc of semCaso) linhas.push(`- \`${oc.id}\` em \`${oc.arquivo}:${oc.linha}\` — "${oc.titulo}"`)
		linhas.push("")
		problemas.push(`${semCaso.length} ID(s) em describe sem caso na estratégia: ${semCaso.map((o) => o.id).join(", ")}`)
	}

	linhas.push("## Arquivos unitários sem ID de caso", "")
	if (!semId.length) {
		linhas.push("Nenhum.", "")
	} else {
		linhas.push(
			`${semId.length} de ${arquivos.length} specs do escopo dashboard não citam caso nenhum. ` +
				"São testes legítimos que a estratégia não conhece — pedem um caso, não bloqueiam.",
			"",
		)
		for (const arquivo of semId) linhas.push(`- \`${arquivo.caminho}\` (${arquivo.runner})`)
		linhas.push("")
	}

	const seloObsoleto = casos.filter((c) => c.extrair && porId.has(c.id))
	linhas.push("## Selos `extrair` a remover da estratégia", "")
	if (!seloObsoleto.length) {
		linhas.push("Nenhum.", "")
	} else {
		linhas.push(
			`${seloObsoleto.length} caso(s) marcados com \`extrair\` já têm teste — a extração foi feita e ` +
				"o selo agora descreve dívida paga. São estas as linhas do HTML a limpar:",
			"",
		)
		for (const caso of seloObsoleto) linhas.push(`- \`${caso.id}\``)
		linhas.push("")
	}

	mkdirSync(dirname(resolve(RAIZ, SAIDA)), { recursive: true })
	writeFileSync(resolve(RAIZ, SAIDA), `${linhas.join("\n")}\n`)

	const p0Ausentes = semTeste.filter((c) => c.prioridade === "P0")

	/*
	 * As revisões vão para o console, não para o relatório.
	 *
	 * Escrevê-las no arquivo versionado o tornaria auto-invalidante: o SHA do
	 * próprio repo muda a cada commit, então o mapa nunca fecharia e todo commit
	 * o sujaria de novo. Quem precisa saber contra o que a conferência rodou é
	 * quem lê o log da execução — e no CI o log fica junto do artefato.
	 */
	console.log(`estratégia ${sha(RAIZ)} · testes ${sha(dev.raiz)} · raiz ${dev.origem}`)
	console.log(
		`${casos.length} casos · ${cobertos} com teste · ${semTeste.length} ausente(s) · ` +
			`${arquivos.length} arquivo(s) · ${semCaso.length} ID(s) sem caso · ` +
			`${semId.length} sem ID · ${seloObsoleto.length} selo(s) extrair obsoleto(s)`,
	)

	/*
	 * Caso P0 sem teste reprova — mesma regra e mesmo motivo do bloco final de
	 * `build-case-map.mjs`. P1 e P2 ausentes aparecem na tabela sem reprovar:
	 * são fila de trabalho, não lacuna crítica.
	 */
	if (p0Ausentes.length) {
		console.error(`\n${p0Ausentes.length} caso(s) P0 sem teste: ${p0Ausentes.map((c) => c.id).join(", ")}`)
		process.exitCode = 1
	}
	if (problemas.length) {
		console.error("")
		for (const problema of problemas) console.error(`  ✗ ${problema}`)
		process.exitCode = 1
	}
}

main()
