import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

/** Tenant reservado a um caso pelo `preSetup`. */
export interface IPooledTenant {
	tenantId: string
	slug: string
	adminEmail: string
	adminPassword: string
}

/**
 * Tenant reservado a um caso que escreve estado global do tenant.
 *
 * Lê o pool gravado por `npm run pre-setup`. Falha com instrução explícita
 * quando o arquivo não existe.
 * @param caseId - Chave em `tenantAllocation` (ex.: `MK-01`)
 */
export function tenantFor(caseId: string): IPooledTenant {
	const file = resolve(process.cwd(), "preSetup/.caseTenants.json")

	if (!existsSync(file)) {
		throw new Error(
			"Pool de tenants por caso não encontrado. Rode 'npm run pre-setup' antes da suíte.",
		)
	}

	const pool: Record<string, IPooledTenant> = JSON.parse(
		readFileSync(file, "utf8"),
	)

	if (!pool[caseId]) {
		throw new Error(
			`Nenhum tenant reservado para "${caseId}". Acrescente o caso em data/tenants.data.ts e rode 'npm run pre-setup'.`,
		)
	}

	return pool[caseId]
}
