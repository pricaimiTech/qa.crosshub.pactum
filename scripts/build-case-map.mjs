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

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
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

/**
 * Casos que a estratégia descreve e que **não são escrevíveis contra o contrato
 * atual**, com o motivo e a issue que registra a lacuna.
 *
 * Sem esta lista, um caso sem teste é indistinguível de um caso esquecido — e
 * era exatamente o que acontecia: o mapa derivava o nome do arquivo do ID e o
 * imprimia existisse ele ou não, então 11 casos apareciam cobertos sem ter uma
 * linha escrita.
 */
const NAO_VERIFICAVEL = {
	"API-F-21": ["sem rota de leitura de trilha no contrato", 96],
	"API-LGPD-13": ["sem rota de leitura de trilha no contrato", 98],
	"API-C-15": ["sem rota de leitura de trilha no contrato", 98],
	"API-AN-04": ["sem rota de leitura de trilha no contrato", 98],

	/*
	 * O `LGPD-02` pede um Principal com `canViewSensitiveData: false` — estado
	 * que só a migração de dados legada produz. Pela API ele é **inalcançável
	 * por construção**, e é o `LGPD-06` que prova: o Principal não consegue
	 * revogar o próprio acesso, e a API responde com texto próprio para isso.
	 *
	 * Ou seja: a guarda que torna o caso impossível de montar já está testada.
	 */
	"API-LGPD-02": ["precondição inalcançável pela API — ver LGPD-06", 123],

	/*
	 * Os três da Home dependem de massa com data retroativa: reservas de 23 h e
	 * 25 h, cadastros de 6 e 8 dias, reservas paradas há 2 e 4 dias. A API grava
	 * com `now()` e a suíte só fala HTTP — não há como envelhecer o dado.
	 */
	"API-H-01": ["exige massa com data retroativa", 123],
	"API-H-02": ["exige massa com data retroativa", 123],
	"API-H-09": ["exige massa com data retroativa", 123],

	/*
	 * O `CAT-15` compara três configurações de e-mail, e duas delas exigem subir
	 * a API sem `EMAIL_FROM` — variável de ambiente do processo, não estado que
	 * um teste possa arranjar.
	 */
	"API-CAT-15": ["exige subir a API com outra env", 123],
}

/**
 * Caso cuja verificação vive no arquivo de OUTRO caso.
 *
 * O `AN-01` percorre as três rotas ausentes de uma vez — incluindo o
 * `DELETE /dashboard/people/{personId}` que o `AN-02` descreve — e falha se
 * qualquer uma passar a existir. Um arquivo próprio para o `AN-02` repetiria a
 * mesma chamada com a mesma asserção.
 */
const COBERTO_POR = {
	"API-AN-02": "API-AN-01",
}

/** Onde o arquivo de teste de um caso deve estar. */
function caminhoTeste(testCase, domain) {
	return `${domain}/tests/functional/${testCase.id.replace(/^API-/, "")}-F.test.ts`
}

/** Casos sem arquivo no disco, acumulados durante a montagem da tabela. */
const semTeste = []

/**
 * A célula "Teste" — conferida contra o disco, não derivada do ID.
 *
 * O que ela dizia antes era só o nome que o arquivo *teria*, montado a partir do
 * ID. Todo caso aparecia coberto, e o mapa afirmava 166 de 166 enquanto havia
 * 156 arquivos.
 */
function celulaTeste(testCase, domain) {
	const rel = caminhoTeste(testCase, domain)
	if (existsSync(resolve(ROOT, rel))) return `\`${rel.split("/").pop()}\``

	const cobertoPor = COBERTO_POR[testCase.id]
	if (cobertoPor) return `coberto por \`${cobertoPor}\``

	const naoVerificavel = NAO_VERIFICAVEL[testCase.id]
	if (naoVerificavel) {
		const [motivo, issue] = naoVerificavel
		semTeste.push({ ...testCase, domain, motivo, issue })
		return `**não verificável** — ${motivo} ([#${issue}](https://github.com/pricaimiTech/dev.CrossHub/issues/${issue}))`
	}

	semTeste.push({ ...testCase, domain })
	return "**ausente**"
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
				celulaTeste(testCase, domain),
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
	"## Casos sem teste",
	"",
)

if (semTeste.length === 0) {
	lines.push("Nenhum. Todo caso da estratégia tem arquivo no disco.", "")
} else {
	const ausentes = semTeste.filter((c) => !c.motivo)
	const naoVerificaveis = semTeste.filter((c) => c.motivo)

	lines.push(
		`**${semTeste.length} de ${cases.length}** casos da estratégia não têm arquivo de teste: ` +
			`${ausentes.length} ausente(s) e ${naoVerificaveis.length} não verificável(is) ` +
			"contra o contrato atual.",
		"",
	)

	if (ausentes.length) {
		const p0 = ausentes.filter((c) => c.prioridade === "P0")
		lines.push(
			`### Ausentes (${ausentes.length}${p0.length ? `, sendo ${p0.length} P0` : ""})`,
			"",
			"| Caso | Prio | Cenário | Onde o arquivo deve ficar |",
			"|---|---|---|---|",
			...ausentes.map(
				(c) =>
					`| \`${c.id}\` | ${c.prioridade} | ${c.cenario.replace(/\|/g, "\\|")} | ` +
					`\`${caminhoTeste(c, c.domain)}\` |`,
			),
			"",
		)
	}

	if (naoVerificaveis.length) {
		lines.push(
			`### Não verificáveis contra o contrato (${naoVerificaveis.length})`,
			"",
			"Descritos na estratégia e sem rota que os torne observáveis. Saem daqui quando a",
			"issue correspondente for resolvida — não antes, e não por serem esquecidos.",
			"",
			"| Caso | Prio | Cenário | Motivo |",
			"|---|---|---|---|",
			...naoVerificaveis.map(
				(c) =>
					`| \`${c.id}\` | ${c.prioridade} | ${c.cenario.replace(/\|/g, "\\|")} | ` +
					`${c.motivo} ([#${c.issue}](https://github.com/pricaimiTech/dev.CrossHub/issues/${c.issue})) |`,
			),
			"",
		)
	}
}

/*
 * O outro sentido da conferência: arquivo no disco que a estratégia não conhece.
 *
 * `G-08b` nasceu de um bug (a formação por similaridade ignorava as respostas) e
 * nunca entrou na estratégia. Um teste fora do mapa não é erro — é caso que a
 * automação descobriu — mas precisa aparecer, senão some da rastreabilidade.
 */
const idsDaEstrategia = new Set(cases.map((c) => c.id.replace(/^API-/, "")))
const forasDoMapa = []
for (const domain of new Set(Object.values(DOMAIN_BY_MODULE))) {
	const dir = resolve(ROOT, `${domain}/tests/functional`)
	if (!existsSync(dir)) continue
	for (const file of readdirSync(dir)) {
		if (!file.endsWith("-F.test.ts")) continue
		const id = file.replace(/-F\.test\.ts$/, "")
		if (!idsDaEstrategia.has(id))
			forasDoMapa.push({ id, path: `${domain}/tests/functional/${file}` })
	}
}

lines.push("## Testes fora da estratégia", "")
if (forasDoMapa.length === 0) {
	lines.push("Nenhum. Todo arquivo no disco corresponde a um caso da estratégia.", "")
} else {
	lines.push(
		`${forasDoMapa.length} arquivo(s) no disco sem caso correspondente. Normalmente é caso que`,
		"a automação descobriu depois de a estratégia ser escrita — vale registrar lá para não sumir",
		"da rastreabilidade.",
		"",
		"| Teste | Arquivo |",
		"|---|---|",
		...forasDoMapa.map((f) => `| \`${f.id}\` | \`${f.path}\` |`),
		"",
	)
}

lines.push(
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

const ausentes = semTeste.filter((c) => !c.motivo)
const ausentesP0 = ausentes.filter((c) => c.prioridade === "P0")

console.log(
	`${cases.length} casos · ${cases.length - semTeste.length} com teste · ` +
		`${ausentes.length} ausente(s) · ${semTeste.length - ausentes.length} não verificável(is) · ` +
		`${usedRoutes.size} rotas cobertas · ${uncovered.length} rotas /dashboard sem caso · ` +
		`${forasDoMapa.length} fora da estratégia · ` +
		`${problems.length} divergências`,
)

/*
 * Caso P0 sem teste reprova o gerador.
 *
 * A coluna "Teste" era derivada do ID e imprimia o nome que o arquivo *teria*:
 * todo caso aparecia coberto, e o mapa afirmava 166 de 166 com 156 arquivos no
 * disco. Três dos que faltavam eram P0. Contagem que ninguém confere apodrece,
 * e esta agora falha em vez de mentir.
 *
 * P1 e P2 ausentes aparecem na tabela sem reprovar: são fila de trabalho, não
 * lacuna crítica.
 */
if (ausentesP0.length) {
	console.error(
		`\n${ausentesP0.length} caso(s) P0 sem teste: ` +
			ausentesP0.map((c) => c.id).join(", "),
	)
	process.exitCode = 1
}

if (problems.length) process.exitCode = 1
