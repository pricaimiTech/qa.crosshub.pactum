import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

/** Admin de tenant reservado a um caso de permissão pelo `preSetup`. */
export interface IPooledAdmin {
	adminId: string
	email: string
	password: string
}

/**
 * Admin reservado a um caso.
 *
 * Lê o pool gravado por `npm run pre-setup`. Falha com instrução explícita
 * quando o arquivo não existe — sem ele nenhum caso de permissão roda.
 * @param caseId - Chave em `adminAllocation` (ex.: `LGPD-04`)
 */
export function adminFor(caseId: string): IPooledAdmin {
	const file = resolve(process.cwd(), "preSetup/.admins.json")

	if (!existsSync(file)) {
		throw new Error(
			"Pool de admins não encontrado. Rode 'npm run pre-setup' antes da suíte.",
		)
	}

	const pool: { admins: Record<string, IPooledAdmin> } = JSON.parse(
		readFileSync(file, "utf8"),
	)

	if (!pool.admins[caseId]) {
		throw new Error(
			`Nenhum admin reservado para "${caseId}". Acrescente o caso em data/admins.data.ts e rode 'npm run pre-setup'.`,
		)
	}

	return pool.admins[caseId]
}
