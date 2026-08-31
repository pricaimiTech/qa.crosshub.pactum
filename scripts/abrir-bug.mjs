#!/usr/bin/env node
/**
 * Abre um bug encontrado pela automação como issue no repositório do produto e
 * o adiciona ao board de QA, devolvendo o trecho `IKnownBug` pronto para colar
 * no `.data.ts` do caso.
 *
 * Uso:
 *   node scripts/abrir-bug.mjs --caso API-AG-05 --titulo "..." --arquivo corpo.md
 *
 * Flags opcionais:
 *   --repo     repositório onde a issue é criada (default abaixo)
 *   --projeto  número do board (default abaixo)
 *   --dono     dono do board (default abaixo)
 *   --dry      monta tudo e mostra os comandos, sem criar nada
 *
 * Requisitos: `gh` autenticado com os escopos `repo` e `project`
 * (`gh auth refresh -s project --hostname github.com`).
 */

import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const REPO_PADRAO = "pricaimiTech/dev.CrossHub"
const DONO_PADRAO = "pricaimiTech"
const PROJETO_PADRAO = "7"

const args = process.argv.slice(2)
const flag = (name) => {
	const index = args.indexOf(`--${name}`)
	return index === -1 ? undefined : args[index + 1]
}

const caso = flag("caso")
const titulo = flag("titulo")
const arquivo = flag("arquivo")
const repo = flag("repo") || REPO_PADRAO
const dono = flag("dono") || DONO_PADRAO
const projeto = flag("projeto") || PROJETO_PADRAO
const dry = args.includes("--dry")

if (!caso || !titulo || !arquivo) {
	console.error(
		"Uso: node scripts/abrir-bug.mjs --caso API-AG-05 --titulo \"...\" --arquivo corpo.md",
	)
	process.exit(2)
}

const corpo = readFileSync(arquivo, "utf8")
const tituloCompleto = `[${caso}] ${titulo}`

const gh = (subcomandos) =>
	execFileSync("gh", subcomandos, { encoding: "utf8" }).trim()

if (dry) {
	console.log(`gh issue create --repo ${repo} --title "${tituloCompleto}"`)
	console.log(`gh project item-add ${projeto} --owner ${dono} --url <issue>`)
	console.log(`\n--- corpo ---\n${corpo}`)
	process.exit(0)
}

const url = gh([
	"issue",
	"create",
	"--repo",
	repo,
	"--title",
	tituloCompleto,
	"--body",
	corpo,
])

const numero = Number(url.split("/").pop())
console.log(`Issue criada: ${url}`)

try {
	gh(["project", "item-add", projeto, "--owner", dono, "--url", url])
	console.log(`Adicionada ao board ${dono}/projects/${projeto}`)
} catch (erro) {
	console.warn(
		`\n⚠️  Issue criada, mas não entrou no board: ${erro.message.split("\n")[0]}\n` +
			`   Rode 'gh auth refresh -s project --hostname github.com' e depois:\n` +
			`   gh project item-add ${projeto} --owner ${dono} --url ${url}`,
	)
}

console.log(
	`\nCole no .data.ts do caso:\n\n` +
		`	knownBug: {\n` +
		`		number: ${numero},\n` +
		`		url: "${url}",\n` +
		`		summary: "${titulo.replace(/"/g, '\\"')}",\n` +
		`	} as IKnownBug,\n`,
)
