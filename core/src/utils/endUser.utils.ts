import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

/** Credenciais de um cliente final já ativado pelo `preSetup`. */
export interface IPooledEndUser {
	personId: string
	email: string
	password: string
}

/**
 * Clientes finais reservados para um caso de teste.
 *
 * Lê o pool gravado por `npm run pre-setup`. Falha com instrução explícita
 * quando o arquivo não existe — sem ele nenhum caso `endUserAuth` roda.
 * @param caseId - ID curto do caso, como usado em `endUserAllocation` (ex.: `AG-11`)
 */
export function endUsersFor(caseId: string): Array<IPooledEndUser> {
	const file = resolve(process.cwd(), "preSetup/.endUsers.json")

	if (!existsSync(file)) {
		throw new Error(
			"Pool de clientes finais não encontrado. Rode 'npm run pre-setup' antes da suíte.",
		)
	}

	const pool: Record<string, Array<IPooledEndUser>> = JSON.parse(
		readFileSync(file, "utf8"),
	)

	if (!pool[caseId]) {
		throw new Error(
			`Nenhum cliente reservado para "${caseId}". Acrescente o caso em data/endUsers.data.ts e rode 'npm run pre-setup'.`,
		)
	}

	return pool[caseId]
}
