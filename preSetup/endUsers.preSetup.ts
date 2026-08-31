import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	authBusiness,
	peopleBusiness,
	personBuilder,
	preSetup,
} from "@core/constants"
import type { IPooledEndUser } from "@core/utils/endUser.utils"
import {
	endUserAllocation,
	endUserPassword,
	endUsersFile,
} from "@shared-data/endUsers.data"

/**
 * Cria e ativa, uma única vez, o pool de clientes finais consumido pelos casos
 * `endUserAuth`.
 *
 * A ativação (`POST /auth/platform/public/activate`) é limitada por rate limit,
 * então as chamadas são espaçadas e nenhum teste ativa cliente por conta
 * própria. O resultado vai para `preSetup/.endUsers.json`, lido por
 * `endUsersFor()`.
 *
 * Rodar com `npm run pre-setup`.
 */
describe("preSetup", () => {
	/** Espera entre ativações, para não esbarrar no limite da rota. */
	const activationDelayMs = 1500

	it("Cria o pool de clientes finais ativados", async function () {
		this.timeout(600000)

		const authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			preSetup.preSetupParamsDefault(201, 5, 500),
		)

		const poolPath = resolve(process.cwd(), endUsersFile)

		// Incremental: clientes já ativados são reaproveitados. Recriar o pool
		// inteiro a cada caso novo desperdiça ativações — que têm rate limit — e
		// deixa pessoas órfãs na base do tenant.
		const pool: Record<string, Array<IPooledEndUser>> = existsSync(poolPath)
			? JSON.parse(readFileSync(poolPath, "utf8"))
			: {}

		for (const [caseId, quantity] of Object.entries(endUserAllocation)) {
			pool[caseId] = pool[caseId] || []

			for (let index = pool[caseId].length; index < quantity; index++) {
				const person = await peopleBusiness.createActivatedPerson(
					personBuilder.withName(`[${caseId}]`).withEmail(caseId).build(),
					`${process.env.TENANT_SLUG}`,
					endUserPassword,
					authParams,
				)

				pool[caseId].push(person)

				await new Promise((done) => setTimeout(done, activationDelayMs))
			}
		}

		writeFileSync(
			poolPath,
			`${JSON.stringify(pool, null, 2)}\n`,
		)
	})
})
