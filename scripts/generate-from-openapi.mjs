#!/usr/bin/env node
/**
 * Gera interfaces (`core/src/interface/**`) e services Pactum (`core/src/services/**`)
 * a partir do contrato `openapi.json` exportado pela API do CrossHub.
 *
 * Regras seguidas (skills `create-interface` e `create-service`):
 *  - Arrays sempre como `Array<T>`, nunca `T[]`; nunca `any`.
 *  - Todo service parte de `specPactumJs()`, usa `apiName`, `expectStatus` e `retry`.
 *  - Rotas autenticadas recebem `.withBearerToken()`.
 *  - JSDoc obrigatório com `@param` e `@returns`.
 *
 * Arquivos já existentes são preservados (o que foi escrito à mão vence).
 * Use `--force` para sobrescrever tudo.
 *
 * Uso: node scripts/generate-from-openapi.mjs [--force] [--dry]
 */

import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs"
import { dirname, resolve } from "node:path"

const ROOT = resolve(import.meta.dirname, "..")
const FORCE = process.argv.includes("--force")
const DRY = process.argv.includes("--dry")

const spec = JSON.parse(readFileSync(resolve(ROOT, "openapi.json"), "utf8"))
const schemas = spec.components.schemas

/** Tag do OpenAPI -> pasta de domínio do projeto. */
const TAG_TO_DOMAIN = {
	"Admin · Add-ons": "addons",
	"Admin · Faturamento": "billing",
	"Admin · Organizações": "tenants",
	"Admin · Planos": "plans",
	Agendamentos: "appointments",
	Arquivos: "assets",
	Auditoria: "audit",
	Autenticação: "auth",
	Banners: "banners",
	Branding: "branding",
	Catálogo: "catalog",
	Dashboard: "dashboard",
	"Dashboard · Analytics": "analytics",
	"Fixtures de teste": "fixtures",
	Formulários: "forms",
	Grupos: "groups",
	Health: "health",
	Pessoas: "people",
	Privacidade: "privacy",
	Público: "public",
}

/** Schemas que não viram interface — já existem no core. */
const SCHEMA_ALIASES = { ApiErrorResponse: "IApiError" }

/**
 * Nomes de service escritos à mão, para rotas cujo `operationId` gera
 * um nome genérico demais (`postCreate`, `getList`, `get`).
 * Chave: `"MÉTODO /caminho"`.
 */
const NAME_OVERRIDES = {
	"get /health": "getHealth",

	"post /auth/platform/login": "postPlatformLogin",

	"get /admin/add-ons": "getListAddOns",
	"get /admin/add-ons/tenants/{tenantId}": "getTenantAddOns",
	"put /admin/add-ons/tenants/{tenantId}": "putSaveTenantAddOns",
	"get /admin/add-ons/tenants/{tenantId}/interests": "getTenantAddOnInterests",
	"get /admin/billing/summary": "getBillingSummary",

	"get /admin/plans": "getListPlans",
	"post /admin/plans": "postCreatePlan",
	"patch /admin/plans/{id}": "patchUpdatePlan",
	"patch /admin/plans/{id}/status": "patchPlanStatus",
	"get /admin/plans/{id}/tenants": "getPlanTenants",

	"get /admin/tenants": "getListTenants",
	"post /admin/tenants": "postCreateTenant",
	"patch /admin/tenants/{id}": "patchUpdateTenant",

	"get /dashboard/analytics/appointments": "getAppointmentsAnalytics",
	"get /dashboard/analytics/appointments/export": "getAppointmentsAnalyticsExport",
	"get /dashboard/analytics/customers": "getCustomersAnalytics",
	"get /dashboard/analytics/customers/export": "getCustomersAnalyticsExport",
	"post /dashboard/analytics/interest": "postRequestAnalyticsInterest",
	"get /dashboard/analytics/interest": "getPendingAnalyticsInterest",

	"get /dashboard/appointments": "getListAppointments",
	"post /dashboard/appointments": "postCreateAppointment",
	"patch /dashboard/appointments/{id}": "patchUpdateAppointmentStatus",
	"patch /dashboard/appointments/{id}/edit": "patchEditAppointment",
	"post /dashboard/appointments/{id}/payments": "postRegisterPayment",
	"post /dashboard/appointments/{id}/refunds": "postRefundPayment",
	"post /dashboard/appointments/{id}/reschedule": "postRescheduleAppointment",

	"get /dashboard/banners": "getListBanners",
	"post /dashboard/banners": "postCreateBanner",
	"patch /dashboard/banners/{id}": "patchUpdateBanner",
	"delete /dashboard/banners/{id}": "deleteBanner",
	"patch /dashboard/banners/order": "patchReorderBanners",
	"patch /dashboard/banners/settings": "patchBannerSettings",
	"post /dashboard/banners/uploads": "postUploadBanner",

	"get /dashboard/branding": "getBranding",
	"put /dashboard/branding": "putSaveBranding",
	"put /dashboard/branding/uploads/presign": "putBrandingPresign",
	"post /dashboard/branding/uploads": "postUploadBranding",

	"get /dashboard/forms": "getListForms",
	"post /dashboard/forms": "postCreateForm",
	"patch /dashboard/forms/{id}": "patchUpdateForm",
	"delete /dashboard/forms/{id}": "deleteForm",

	"get /dashboard/groups": "getListGroups",
	"post /dashboard/groups": "postCreateGroup",
	"patch /dashboard/groups/{groupId}": "patchUpdateGroup",
	"post /dashboard/groups/{groupId}/activate": "postActivateGroup",

	"get /dashboard/people": "getListPeople",
	"post /dashboard/people": "postCreatePerson",
	"patch /dashboard/people/{personId}": "patchUpdatePerson",

	"patch /dashboard/privacy/professionals/{userId}/sensitive-data-access":
		"patchSensitiveDataAccess",

	"get /public/appointments/services": "getPublicServices",
	"get /public/appointments/availability": "getPublicAvailability",
	"post /public/appointments": "postPublicCreateAppointment",
	"get /public/me/appointments": "getPublicMyAppointments",
	"post /public/me/appointments/{id}/cancel": "postPublicCancelAppointment",
	"get /public/me/packages": "getPublicMyPackages",
	"get /public/tenants/{slug}": "getPublicTenant",
	"get /public/tenants/{slug}/products": "getPublicProducts",
	"get /public/tenants/{slug}/categories": "getPublicCategories",
	"post /public/products/{id}/reservations": "postPublicReserveProduct",
	"get /public/me/reservations": "getPublicMyReservations",
	"patch /public/me/reservations/{id}/cancel": "patchPublicCancelReservation",
	"get /public/me/forms": "getPublicMyForms",
	"get /public/forms/{id}": "getPublicForm",
	"post /public/forms/{id}/submissions": "postPublicSubmitForm",
}

/** Services escritos à mão — nunca sobrescritos, nem com `--force`. */
const PRESERVED = new Set([
	"core/src/services/auth/postPlatformLogin.service.ts",
	"core/src/services/auth/postTenantLogin.service.ts",
	// Rota documentada na especificação, ausente do contrato — ver caso AG-22.
	"core/src/services/public/postPublicRescheduleAppointment.service.ts",
	// Disputa da última vaga: não assere status, ver caso AG-16.
	"core/src/services/public/postPublicCreateAppointmentRace.service.ts",
	// Rotas de anonimização que não existem de propósito, ver caso AN-01.
	"core/src/services/privacy/postAnonymizationRequest.service.ts",
])

const apiData = readFileSync(
	resolve(ROOT, "core/src/interface/../data/api.data.ts"),
	"utf8",
)
const apiNames = [...apiData.matchAll(/^\t(\w+): "([^"]+)",$/gm)]
	.map(([, key, value]) => ({ key, value }))
	.sort((a, b) => b.value.length - a.value.length)

// ---------------------------------------------------------------- utilidades

const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const camel = (s) => s.charAt(0).toLowerCase() + s.slice(1)

/** Nome da interface gerada para um schema do contrato. */
function interfaceName(schemaName) {
	if (SCHEMA_ALIASES[schemaName]) return SCHEMA_ALIASES[schemaName]
	return `I${schemaName.replace(/Dto$/, "")}`
}

/** Converte um schema do OpenAPI em um tipo TypeScript. */
function tsType(schema, indent = "\t") {
	if (!schema) return "unknown"

	if (schema.$ref) return interfaceName(schema.$ref.split("/").pop())

	if (schema.allOf) {
		const parts = schema.allOf.map((s) => tsType(s, indent))
		return parts.length === 1 ? parts[0] : parts.join(" & ")
	}

	const union = schema.oneOf || schema.anyOf
	if (union) {
		const parts = [...new Set(union.map((s) => tsType(s, indent)))]
		return parts.join(" | ")
	}

	if (schema.enum) {
		const parts = schema.enum.map((v) =>
			typeof v === "string" ? `"${v}"` : String(v),
		)
		return parts.join(" | ") + (schema.nullable ? " | null" : "")
	}

	let type
	switch (schema.type) {
		case "array":
			type = `Array<${tsType(schema.items, indent)}>`
			break
		case "integer":
		case "number":
			type = "number"
			break
		case "boolean":
			type = "boolean"
			break
		case "string":
			type = "string"
			break
		case "object":
		case undefined:
			if (schema.properties) type = objectLiteral(schema, indent)
			else if (schema.additionalProperties)
				type = `Record<string, ${tsType(schema.additionalProperties, indent)}>`
			else type = "Record<string, unknown>"
			break
		default:
			type = "unknown"
	}

	return schema.nullable ? `${type} | null` : type
}

/** Objeto inline (schema sem nome próprio no contrato). */
function objectLiteral(schema, indent) {
	const inner = `${indent}\t`
	const required = new Set(schema.required || [])
	const lines = Object.entries(schema.properties).map(([name, prop]) => {
		const optional = required.has(name) ? "" : "?"
		const key = /^[A-Za-z_$][\w$]*$/.test(name) ? name : `"${name}"`
		return `${inner}${key}${optional}: ${tsType(prop, inner)}`
	})
	return `{\n${lines.join("\n")}\n${indent}}`
}

/** Bloco de interface nomeada, com JSDoc vindo do contrato. */
function renderInterface(schemaName, schema) {
	const name = interfaceName(schemaName)
	const doc = schema.description ? `/** ${schema.description} */\n` : ""

	if (schema.type !== "object" || !schema.properties) {
		return `${doc}export type ${name} = ${tsType(schema, "")}\n`
	}

	const required = new Set(schema.required || [])
	const lines = Object.entries(schema.properties).map(([prop, propSchema]) => {
		const optional = required.has(prop) ? "" : "?"
		const key = /^[A-Za-z_$][\w$]*$/.test(prop) ? prop : `"${prop}"`
		const comment = propSchema.description
			? `\t/** ${propSchema.description} */\n`
			: ""
		return `${comment}\t${key}${optional}: ${tsType(propSchema, "\t")}`
	})

	return `${doc}export interface ${name} {\n${lines.join("\n")}\n}\n`
}

/** Todos os schemas alcançáveis a partir de um schema raiz. */
function collectRefs(schema, acc = new Set()) {
	if (!schema || typeof schema !== "object") return acc

	if (schema.$ref) {
		const name = schema.$ref.split("/").pop()
		if (!acc.has(name) && !SCHEMA_ALIASES[name]) {
			acc.add(name)
			collectRefs(schemas[name], acc)
		}
		return acc
	}

	for (const value of Object.values(schema)) {
		if (Array.isArray(value)) value.forEach((v) => collectRefs(v, acc))
		else if (value && typeof value === "object") collectRefs(value, acc)
	}
	return acc
}

/** Nome do service: verbo HTTP + ação do `operationId`. */
function serviceName(method, operationId) {
	const action = camel(operationId.split("_").pop())
	if (action.toLowerCase().startsWith(method)) return action
	return `${method}${pascal(action)}`
}

/** Chave de `apiName` que cobre o caminho, e o que sobra dele. */
function splitPath(path) {
	const match = apiNames.find(
		(entry) => path === entry.value || path.startsWith(`${entry.value}/`),
	)
	if (!match) throw new Error(`Sem prefixo em api.data.ts para "${path}"`)
	return { key: match.key, rest: path.slice(match.value.length) }
}

function writeFile(path, content) {
	const full = resolve(ROOT, path)
	if (PRESERVED.has(path)) return "preservado"
	if (existsSync(full) && !FORCE) return "mantido"
	if (DRY) return "dry-run"
	mkdirSync(dirname(full), { recursive: true })
	writeFileSync(full, content)
	return "escrito"
}

/**
 * Propriedades de um schema de multipart, resolvendo o `$ref` quando houver.
 * @param schema - Schema declarado em `multipart/form-data`
 */
function multipartProperties(schema) {
	if (!schema) return {}
	if (schema.$ref) return schemas[schema.$ref.split("/").pop()]?.properties || {}

	return schema.properties || {}
}

// ------------------------------------------------------ coleta das operações

const operations = []

for (const [path, pathItem] of Object.entries(spec.paths)) {
	for (const [method, op] of Object.entries(pathItem)) {
		const tag = (op.tags || [])[0]
		const domain = TAG_TO_DOMAIN[tag]
		if (!domain) throw new Error(`Tag sem domínio mapeado: "${tag}"`)

		const params = op.parameters || []
		const body =
			op.requestBody?.content?.["application/json"]?.schema ||
			(op.requestBody ? { type: "object" } : null)

		operations.push({
			path,
			method,
			domain,
			op,
			name:
				NAME_OVERRIDES[`${method} ${path}`] ||
				serviceName(method, op.operationId),
			pathParams: params.filter((p) => p.in === "path"),
			queryParams: params.filter((p) => p.in === "query"),
			body,
			auth: Object.keys((op.security || [])[0] || {})[0],
			multipart: Boolean(op.requestBody?.content?.["multipart/form-data"]),
			multipartFields: Object.entries(
				multipartProperties(op.requestBody?.content?.["multipart/form-data"]?.schema),
			)
				.filter(([, prop]) => prop.format !== "binary")
				.map(([name, prop]) => ({
					name,
					type: prop.enum
						? prop.enum.map((v) => `"${v}"`).join(" | ")
						: "string",
				})),
		})
	}
}

// ------------------------------------------- distribuição dos schemas por domínio

/** schema -> domínios que o usam. */
const schemaDomains = new Map()

for (const operation of operations) {
	const used = new Set()
	collectRefs(operation.body, used)
	for (const response of Object.values(operation.op.responses || {}))
		collectRefs(response.content?.["application/json"]?.schema, used)

	for (const schemaName of used) {
		if (!schemaDomains.has(schemaName)) schemaDomains.set(schemaName, new Set())
		schemaDomains.get(schemaName).add(operation.domain)
	}
}

const SHARED = "shared"
const ownerOf = new Map(
	[...schemaDomains].map(([name, domains]) => [
		name,
		domains.size > 1 ? SHARED : [...domains][0],
	]),
)

/** Interfaces de query string, por domínio. */
const queryInterfaces = new Map()

for (const operation of operations) {
	if (!operation.queryParams.length) continue
	const name = `I${pascal(operation.name)}Query`
	const lines = operation.queryParams.map((p) => {
		const comment = p.description ? `\t/** ${p.description} */\n` : ""
		return `${comment}\t${p.name}${p.required ? "" : "?"}: ${tsType(p.schema, "\t")}`
	})
	const doc = `/** Query string de \`${operation.method.toUpperCase()} ${operation.path}\`. */\n`
	const block = `${doc}export interface ${name} {\n${lines.join("\n")}\n}\n`

	if (!queryInterfaces.has(operation.domain))
		queryInterfaces.set(operation.domain, [])
	queryInterfaces.get(operation.domain).push(block)
	operation.queryInterface = name
}

// ------------------------------------------------- escrita dos arquivos

const domainsWithInterfaces = new Set([
	...ownerOf.values(),
	...queryInterfaces.keys(),
])
const results = []

for (const domain of [...domainsWithInterfaces].sort()) {
	const owned = [...ownerOf]
		.filter(([, owner]) => owner === domain)
		.map(([name]) => name)
		.sort()

	const imports =
		domain === SHARED
			? []
			: [
					...new Set(
						owned
							.flatMap((name) => [...collectRefs(schemas[name])])
							.filter((ref) => ownerOf.get(ref) === SHARED)
							.map(interfaceName),
					),
				].sort()

	const header =
		`/**\n * Contratos do domínio \`${domain}\` gerados de \`openapi.json\`.\n` +
		` * Regerar com \`npm run generate:api\`.\n */\n`
	const importLine = imports.length
		? `import type { ${imports.join(", ")} } from "../shared/IShared.interface"\n\n`
		: ""

	const blocks = [
		...owned.map((name) => renderInterface(name, schemas[name])),
		...(queryInterfaces.get(domain) || []),
	]

	const file = `core/src/interface/${domain}/I${pascal(domain)}.interface.ts`
	results.push([file, writeFile(file, header + importLine + blocks.join("\n"))])
}

for (const operation of operations) {
	const { key, rest } = splitPath(operation.path)
	const args = []
	const jsdoc = []

	for (const param of operation.pathParams) {
		args.push(`${param.name}: string`)
		jsdoc.push(`@param ${param.name} - ${param.description || param.name}`)
	}

	if (operation.queryInterface) {
		args.push(`query: ${operation.queryInterface}`)
		jsdoc.push("@param query - Filtros enviados na query string")
	}

	let bodyType = null
	if (operation.multipart) {
		args.push("filePath: string")
		jsdoc.push(
			"@param filePath - Caminho do arquivo enviado no campo `file` do multipart",
		)

		for (const field of operation.multipartFields) {
			args.push(`${field.name}: ${field.type}`)
			jsdoc.push(`@param ${field.name} - Campo \`${field.name}\` do multipart`)
		}
	} else if (operation.body) {
		bodyType = tsType(operation.body, "\t")
		args.push(`payload: ${bodyType}`)
		jsdoc.push("@param payload - Corpo da requisição")
	}

	args.push("paramsDefault: IParamsDefault")
	jsdoc.push("@param paramsDefault - Parâmetros padrão da requisição")

	// Imports de interface do domínio / compartilhadas.
	const needed = new Map()
	const addImport = (typeName) => {
		if (!typeName || typeName === "IApiError") return
		const schemaName = [...ownerOf.keys()].find(
			(n) => interfaceName(n) === typeName,
		)
		const domain = schemaName ? ownerOf.get(schemaName) : operation.domain
		if (!needed.has(domain)) needed.set(domain, new Set())
		needed.get(domain).add(typeName)
	}
	if (bodyType?.startsWith("I")) addImport(bodyType)
	if (operation.queryInterface) addImport(operation.queryInterface)

	const importLines = [...needed]
		.sort()
		.map(([domain, names]) => {
			const file =
				domain === SHARED
					? "../../interface/shared/IShared.interface"
					: `../../interface/${domain}/I${pascal(domain)}.interface`
			return `import type { ${[...names].sort().join(", ")} } from "${file}"`
		})
		.join("\n")

	const url = rest
		? `\`\${process.env.BASE_URL}\${apiName.${key}}${rest.replace(/\{(\w+)\}/g, "${$1}")}\``
		: `\`\${process.env.BASE_URL}\${apiName.${key}}\``

	const opening = operation.queryInterface
		? `\t\twithQuery(specPactumJs().${operation.method}(${url}), query)`
		: `\t\tspecPactumJs()\n\t\t\t.${operation.method}(${url})`

	const chain = []
	if (operation.auth)
		chain.push("\t\t\t.withBearerToken(`${paramsDefault.token}`)")
	if (operation.multipart) {
		chain.push('\t\t\t.withFile("file", filePath)')
		for (const field of operation.multipartFields) {
			chain.push(
				`\t\t\t.withMultiPartFormData("${field.name}", ${field.name})`,
			)
		}
	}
	if (!operation.multipart && operation.body)
		chain.push("\t\t\t.withJson(payload)")
	chain.push(
		`\t\t\t.expectStatus(\n\t\t\t\tparamsDefault.statusCode,\n\t\t\t\t\`O status code da requisição ${operation.method.toUpperCase()} ${operation.path} não é o esperado.\`,\n\t\t\t)`,
	)
	// Retry só em leitura. Repetir POST/PUT/PATCH/DELETE reexecuta o efeito
	// colateral: a primeira tentativa cria o recurso, a segunda esbarra no
	// conflito que ela mesma provocou e o teste falha por um motivo inventado.
	if (operation.method === "get") {
		chain.push(
			"\t\t\t.retry({\n\t\t\t\tcount: paramsDefault.retry.count,\n\t\t\t\tdelay: paramsDefault.retry.delay,\n\t\t\t\tstrategy: ({ res }) => res.statusCode === paramsDefault.statusCode,\n\t\t\t})",
		)
	}

	const summary =
		operation.op.summary ||
		operation.op.description ||
		`${operation.method.toUpperCase()} ${operation.path}`
	const returns = `@returns Resposta de \`${operation.method.toUpperCase()} ${operation.path}\``

	const content =
		`import { specPactumJs } from "../../constants"\n` +
		`import { apiName } from "../../data/api.data"\n` +
		(operation.queryInterface
			? `import { withQuery } from "../../utils/query.utils"\n`
			: "") +
		`import type { IParamsDefault } from "../../interface/global.interface"\n` +
		(importLines ? `${importLines}\n` : "") +
		`\n/**\n * ${summary}\n${jsdoc.map((l) => ` * ${l}`).join("\n")}\n * ${returns}\n */\n` +
		`export default async function ${operation.name}(\n${args.map((a) => `\t${a},`).join("\n")}\n) {\n` +
		`\treturn await (\n${opening}\n${chain.join("\n")}\n\t)\n}\n`

	const file = `core/src/services/${operation.domain}/${operation.name}.service.ts`
	results.push([file, writeFile(file, content)])
}

// Remove services de execuções anteriores que sumiram do contrato.
const generated = new Set(results.map(([file]) => file))
for (const domain of readdirSync(resolve(ROOT, "core/src/services"))) {
	const dir = `core/src/services/${domain}`
	for (const entry of readdirSync(resolve(ROOT, dir))) {
		const file = `${dir}/${entry}`
		if (generated.has(file) || PRESERVED.has(file) || !entry.endsWith(".ts"))
			continue
		if (!DRY) rmSync(resolve(ROOT, file))
		results.push([file, "removido"])
	}
}

const tally = results.reduce((acc, [, status]) => {
	acc[status] = (acc[status] || 0) + 1
	return acc
}, {})

console.log(
	`${operations.length} operações · ${ownerOf.size} schemas\n`,
	Object.entries(tally)
		.map(([k, v]) => `${k}: ${v}`)
		.join(" · "),
)
