#!/usr/bin/env node
/**
 * Resolve a raiz do repositório de desenvolvimento (`dev.CrossHub`).
 *
 * A estratégia de testes vive aqui, no repo de QA; a implementação dos testes
 * vive no repo de desenvolvimento. Quem confere a rastreabilidade precisa ler os
 * dois, e os dois são clonagens irmãs — não submódulos.
 *
 * A resolução é uma cascata, do mais explícito ao mais conveniente:
 *
 *   1. argumento de CLI    — depuração, ou apontar para o worktree de outra branch
 *   2. CROSSHUB_DEV_ROOT   — o CI, onde `actions/checkout` obriga a usar `path:`
 *                            e o caminho não é `../`
 *   3. `../dev.CrossHub`   — a topologia que as duas clonagens já usam
 *
 * Deliberadamente NÃO há arquivo de config: seria uma quarta fonte de verdade,
 * e um caminho de máquina versionado ou um arquivo ignorado que o CI não lê.
 *
 * `origem` viaja junto porque é o que faz uma raiz errada aparecer no diff do
 * relatório, em vez de virar 46 casos "ausentes" em silêncio.
 */
import { existsSync } from "node:fs"
import { relative, resolve } from "node:path"

const RAIZ_QA = resolve(import.meta.dirname, "..", "..")

/*
 * Sentinela da detecção.
 *
 * `__tests__/README.md` não aparece por acidente: é o documento do padrão de
 * pastas. Um diretório que o tenha é a árvore de testes; um que não o tenha não
 * é o repo procurado, ainda que se chame `dev.CrossHub`.
 */
const SENTINELA = "__tests__/README.md"

/**
 * @param {{ argv?: string[], env?: NodeJS.ProcessEnv }} [opcoes]
 * @returns {{ raiz: string, origem: 'cli'|'env'|'padrao', disponivel: boolean, sentinela: string }}
 */
export function resolveRaizDev({ argv = process.argv.slice(2), env = process.env } = {}) {
	const doCli = argv.find((arg) => !arg.startsWith("-"))
	const doEnv = env.CROSSHUB_DEV_ROOT
	const bruto = doCli ?? doEnv ?? resolve(RAIZ_QA, "..", "dev.CrossHub")
	const origem = doCli ? "cli" : doEnv ? "env" : "padrao"
	const raiz = resolve(bruto)
	return { raiz, origem, disponivel: existsSync(resolve(raiz, SENTINELA)), sentinela: SENTINELA }
}

/*
 * Uma linha para o cabeçalho do relatório, dizendo contra o que ele asseverou.
 *
 * O caminho sai relativo ao repo de QA quando cabe (`../dev.CrossHub`), porque
 * o relatório é versionado: imprimir o absoluto encheria o diff de
 * `/Users/<nome>/…` e `/home/runner/work/…` a cada máquina. Uma raiz fora do
 * lugar continua aparecendo — é justamente aí que o relativo fica esquisito.
 */
export function descreveRaiz({ raiz, origem, disponivel }) {
	const comoVeio = { cli: "argumento de linha de comando", env: "CROSSHUB_DEV_ROOT", padrao: "caminho relativo padrão" }[origem]
	const rel = relative(RAIZ_QA, raiz)
	const exibido = rel && !rel.startsWith("../..") ? rel : raiz
	return `\`${exibido}\` (${comoVeio})${disponivel ? "" : " — **não encontrada**"}`
}
