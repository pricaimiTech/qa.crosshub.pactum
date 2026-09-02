#!/usr/bin/env node
/**
 * Varre a árvore de testes unitários do repo de desenvolvimento e devolve quais
 * casos `UNIT-*` da estratégia cada arquivo declara.
 *
 * Por que varrer conteúdo em vez de derivar nome de arquivo, como faz
 * `build-case-map.mjs` na camada de API: lá o ID *é* o nome do arquivo
 * (`AG-16` → `AG-16-F.test.ts`), então `existsSync` basta. Aqui os specs são
 * nomeados pelo alvo (`grade-de-horarios.spec.ts`) e **um arquivo cobre vários
 * casos**, declarados no texto do `describe`. Derivar nome não casaria nada.
 */
import { readFileSync, readdirSync } from "node:fs"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

/*
 * As raízes e os sufixos saem dos configs dos runners, não de adivinhação:
 * `apps/api/jest.config.cjs` tem `roots: ['<rootDir>/__tests__/unit/api', …]` e
 * `testRegex: '.*\\.spec\\.ts$'`; `apps/dashboard/vitest.config.mts` tem
 * `include: ['__tests__/unit/front/dashboard/**\/*.test.ts']`.
 *
 * Como diz o `__tests__/README.md`: o sufixo decide, não a pasta.
 */
const RAIZES = [
	{ rel: "__tests__/unit/api", runner: "jest", sufixo: ".spec.ts" },
	{ rel: "__tests__/unit/front", runner: "vitest", sufixo: ".test.ts" },
]

/*
 * Só a superfície `dashboard` responde a esta estratégia.
 *
 * `unit/api/admin/**`, `unit/front/admin/**` e `unit/api/comum/**` respondem à
 * estratégia do admin. Incluí-los faria o mapa reportar ~20 lacunas fantasma
 * para sempre — e um relatório que sempre acusa lacuna é um relatório que todo
 * mundo aprende a ignorar.
 */
const ESCOPO = /(^|\/)dashboard\//

/*
 * Só `describe(` no começo da linha conta como declaração.
 *
 * A âncora `^[ \t]*` é o que separa uma chamada real de uma menção em prosa: os
 * comentários de cabeçalho dos specs citam faixas (` * UNIT-H-01 a -04`,
 * ` * UNIT-AG-04 a -08`) que jamais podem valer como cobertura. Remover
 * comentários antes de casar seria pior — quebraria em `/*` dentro de string.
 */
const RE_DESCRIBE = /^[ \t]*describe(?:\.\w+)?\s*\(\s*(['"`])([\s\S]*?)\1/

/**
 * IDs declarados num título de `describe`, com herança de prefixo.
 *
 * `'UNIT-MK-02 / MK-03 / BN-03 — publicUrl'` declara três casos, e o 2º e o 3º
 * vêm sem o prefixo `UNIT-`. A forma curta vale **apenas como continuação** de
 * um ID explícito no mesmo título — sem essa regra, um `describe('AG-01 — …')`
 * solto seria reivindicado como cobertura de `UNIT-AG-01`.
 *
 * @param {string} titulo
 * @returns {string[]}
 */
export function idsDoTitulo(titulo) {
	// O ID vive antes do travessão; o resto do título é prosa livre e pode
	// conter qualquer coisa (`(wizard)`, `— o intervalo entra no passo…`).
	const cabeca = titulo.split(/\s+[—–-]\s+/)[0]
	const achados = []
	for (const parte of cabeca.split(/\s*\/\s*/)) {
		const item = parte.trim()
		const explicito = item.match(/^UNIT-([A-Z]+)-(\d+)$/)
		if (explicito) {
			achados.push(item)
			continue
		}
		const curto = item.match(/^([A-Z]+)-(\d+)$/)
		if (curto && achados.length) achados.push(`UNIT-${curto[1]}-${curto[2]}`)
	}
	return achados
}

/** Todos os arquivos de teste de uma raiz, com o runner que os executa. */
function arquivosDe(raizDev, { rel, runner, sufixo }) {
	const dir = resolve(raizDev, rel)
	if (!existsSync(dir)) return []
	return readdirSync(dir, { recursive: true, withFileTypes: true })
		.filter((entrada) => entrada.isFile() && entrada.name.endsWith(sufixo))
		.map((entrada) => {
			const absoluto = resolve(entrada.parentPath ?? entrada.path, entrada.name)
			return { absoluto, caminho: absoluto.slice(resolve(raizDev).length + 1), runner }
		})
		.filter((arquivo) => ESCOPO.test(arquivo.caminho))
}

/**
 * @typedef {{ id: string, arquivo: string, linha: number, titulo: string, runner: string }} Ocorrencia
 * @returns {{ porId: Map<string, Ocorrencia[]>, arquivos: {caminho: string, runner: string, ids: string[]}[] }}
 */
export function varrer(raizDev) {
	/*
	 * Acumulador, nunca `Map.set`.
	 *
	 * `UNIT-G-01` e `UNIT-MK-01` são cobertos nos DOIS lados de propósito — há
	 * um arquivo na API e um no front, porque o caso prova que duas
	 * implementações da mesma regra concordam. Um `set` descartaria um dos lados
	 * e o relatório mentiria sobre onde a prova vive.
	 */
	const porId = new Map()
	const arquivos = []

	for (const raiz of RAIZES) {
		for (const arquivo of arquivosDe(raizDev, raiz)) {
			const ids = []
			const linhas = readFileSync(arquivo.absoluto, "utf8").split("\n")
			for (const [indice, linha] of linhas.entries()) {
				const chamada = linha.match(RE_DESCRIBE)
				if (!chamada) continue
				for (const id of idsDoTitulo(chamada[2])) {
					ids.push(id)
					const ocorrencia = { id, arquivo: arquivo.caminho, linha: indice + 1, titulo: chamada[2], runner: arquivo.runner }
					porId.set(id, [...(porId.get(id) ?? []), ocorrencia])
				}
			}
			arquivos.push({ caminho: arquivo.caminho, runner: arquivo.runner, ids: [...new Set(ids)] })
		}
	}

	return { porId, arquivos }
}
