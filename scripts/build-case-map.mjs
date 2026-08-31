#!/usr/bin/env node
/**
 * Constrói `docs/plans/mapa-casos-api.md` — a rastreabilidade entre os casos de API
 * da estratégia de testes, os endpoints do `openapi.json` e os services gerados
 * em `core/src/services/`.
 *
 * Fonte: `.doc/dashboard/estrategia-testes-dashboard.json` (artefato de build da
 * estratégia, com rota, token, status e asserções literais por caso).
 *
 * Também valida o casamento nos dois sentidos e falha quando encontra caso
 * apontando para rota que não existe no contrato.
 *
 * Uso: node scripts/build-case-map.mjs
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const ROOT = resolve(import.meta.dirname, "..")
const STRATEGY = ".doc/dashboard/estrategia-testes-dashboard.json"

/** Prefixo do ID do caso -> pasta de domínio do projeto. */
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

/** Audiência do JWT -> business/login que o teste usa no `before`. */
const LOGIN_BY_TOKEN = {
	tenantAuth: "loginAsTenantAdmin",
	platformAuth: "loginAsPlatformAdmin",
	endUserAuth: "loginAsEndUser",
}

const strategy = JSON.parse(readFileSync(resolve(ROOT, STRATEGY), "utf8"))
const spec = JSON.parse(readFileSync(resolve(ROOT, "openapi.json"), "utf8"))
const cases = strategy.casos

// ------------------------------------------------------- services por rota

/** `"GET /caminho"` -> `{ name, domain }`. */
const serviceByRoute = new Map()

for (const domain of readdirSync(resolve(ROOT, "core/src/services"))) {
	for (const file of readdirSync(resolve(ROOT, `core/src/services/${domain}`))) {
		const source = readFileSync(
			resolve(ROOT, `core/src/services/${domain}/${file}`),
			"utf8",
		)
		// Services gerados declaram a rota no `@returns`; os escritos à mão, em
		// `@rota`. Já `@rotaAusente` marca o service que existe **para provar que
		// a rota não existe** (casos AG-22 e AN-01) — ele não entra no mapa de
		// rotas do contrato, senão a ausência pareceria presença.
		const route = source.includes("@rotaAusente")
			? null
			: source.match(/@rota ([A-Z]+ \S+)/) ||
				source.match(/@returns Resposta de `([A-Z]+ [^`]+)`/)
		if (route)
			serviceByRoute.set(route[1], {
				name: file.replace(/\.service\.ts$/, ""),
				domain,
			})
	}
}

const routeKey = (r) => `${r.metodo} ${r.caminho}`

// -------------------------------------------------- bugs abertos pela automação

/** ID do caso -> `{ number, url }`, lido de `data/knownBugs.data.ts`. */
const bugByCase = new Map()

const bugsSource = readFileSync(resolve(ROOT, "data/knownBugs.data.ts"), "utf8")
for (const bug of bugsSource.matchAll(
	/"(API-[A-Z]+-\d+)":\s*\{\s*number:\s*(\d+),\s*url:\s*"([^"]+)"/g,
)) {
	bugByCase.set(bug[1], { number: Number(bug[2]), url: bug[3] })
}

// -------------------------------------------------------------- validação

const problems = []
const usedRoutes = new Set()

for (const testCase of cases) {
	if (!DOMAIN_BY_MODULE[testCase.modulo])
		problems.push(`${testCase.id}: módulo "${testCase.modulo}" sem domínio mapeado`)

	for (const route of testCase.rotas) {
		const key = routeKey(route)
		const exists = serviceByRoute.has(key)

		if (route.papel === "inexistente") {
			if (exists)
				problems.push(
					`${testCase.id}: rota marcada como inexistente, mas o contrato tem \`${key}\``,
				)
			continue
		}

		if (!exists) {
			problems.push(`${testCase.id}: sem service para \`${key}\``)
			continue
		}
		usedRoutes.add(key)
	}
}

// ------------------------------------------------------------- markdown

const link = (route) => {
	const key = routeKey(route)
	const service = serviceByRoute.get(key)
	if (route.papel === "inexistente") return `\`${key}\` *(não existe no contrato)*`
	return service ? `\`${service.name}\`` : `\`${key}\` **sem service**`
}

const lines = [
	"# Mapa dos casos de API — Estratégia do Dashboard",
	"",
	`Rastreabilidade entre os **${cases.length} casos de API** de \`${STRATEGY}\` ` +
		`(${strategy.totais.p0} deles P0), os endpoints de \`openapi.json\` e os services ` +
		"em `core/src/services/`.",
	"",
	`Estratégia gerada em ${strategy.gerado} · mapa gerado por \`npm run generate:map\` — não editar à mão.`,
	"",
	"| Convenção | Valor |",
	"|---|---|",
	"| Arquivo de teste | `<dominio>/tests/functional/<ID sem o prefixo API->-F.test.ts` |",
	"| Jornadas E2E | `<dominio>/tests/e2e/`, com os IDs `E2E-*` da estratégia |",
	"| Service | `core/src/services/<dominio>/<nome>.service.ts` |",
	"| Login no `before` | conforme a coluna Token: " +
		Object.entries(LOGIN_BY_TOKEN)
			.map(([token, login]) => `\`${token}\` → \`${login}()\``)
			.join(" · ") +
		" |",
	"",
]

if (problems.length) {
	lines.push(
		"## ⚠️ Divergências entre estratégia e contrato",
		"",
		...problems.map((p) => `- ${p}`),
		"",
	)
}

for (const [module, domain] of Object.entries(DOMAIN_BY_MODULE)) {
	const moduleCases = cases.filter((c) => c.modulo === module)
	if (!moduleCases.length) continue

	lines.push(
		`## ${moduleCases[0].moduloNome} (\`${module}\`)`,
		"",
		`Domínio: \`${domain}/\` · casos: ${moduleCases.length} ` +
			`(P0: ${moduleCases.filter((c) => c.prioridade === "P0").length})`,
		"",
		"| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |",
		"|---|---|---|---|---|---|---|---|---|---|",
	)

	for (const testCase of moduleCases) {
		const action = testCase.rotas.filter((r) => r.papel !== "arranjo")
		const setup = testCase.rotas.filter((r) => r.papel === "arranjo")
		const literals = (testCase.literais || [])
			.map((l) => `\`${l.replace(/\|/g, "\\|")}\``)
			.join("<br>")

		lines.push(
			[
				`\`${testCase.id}\``,
				testCase.prioridade,
				testCase.cenario.replace(/\|/g, "\\|"),
				testCase.token ? `\`${testCase.token}\`` : "—",
				testCase.status.join(", "),
				action.map(link).join("<br>") || "—",
				setup.map(link).join("<br>") || "—",
				literals || "—",
				`\`${testCase.id.replace(/^API-/, "")}-F.test.ts\``,
				bugByCase.has(testCase.id)
					? `[#${bugByCase.get(testCase.id).number}](${bugByCase.get(testCase.id).url})`
					: "—",
			].join(" | ")
				.replace(/^/, "| ")
				.concat(" |"),
		)
	}
	lines.push("")
}

// ------------------------------------------- cobertura do contrato

const dashboardRoutes = Object.keys(spec.paths)
	.filter((p) => p.startsWith("/dashboard"))
	.flatMap((p) => Object.keys(spec.paths[p]).map((m) => `${m.toUpperCase()} ${p}`))
	.sort()

const uncovered = dashboardRoutes.filter((r) => !usedRoutes.has(r))

lines.push(
	"## Bugs abertos pela automação",
	"",
	bugByCase.size
		? `${bugByCase.size} caso(s) vermelho(s) de propósito, com issue aberta no ` +
			"[board de QA](https://github.com/users/pricaimiTech/projects/7/views/4):"
		: "Nenhum bug aberto no momento.",
	"",
	...[...bugByCase].map(
		([caso, bug]) =>
			`- \`${caso}\` → [#${bug.number}](${bug.url}) — o teste segue falhando até a correção`,
	),
	"",
	"## Cobertura do contrato",
	"",
	`Rotas citadas por algum caso: **${usedRoutes.size}** de ${serviceByRoute.size} do contrato.`,
	"",
	`### Rotas \`/dashboard/**\` sem nenhum caso de API (${uncovered.length} de ${dashboardRoutes.length})`,
	"",
)
for (const route of uncovered) {
	const service = serviceByRoute.get(route)
	lines.push(
		`- \`${route}\` → \`${service ? `${service.domain}/${service.name}` : "?"}\``,
	)
}
lines.push("")

mkdirSync(resolve(ROOT, "docs/plans"), { recursive: true })
writeFileSync(resolve(ROOT, "docs/plans/mapa-casos-api.md"), lines.join("\n"))

console.log(
	`${cases.length} casos · ${usedRoutes.size} rotas cobertas · ` +
		`${uncovered.length} rotas /dashboard sem caso · ${problems.length} divergências`,
)

if (problems.length) process.exitCode = 1
