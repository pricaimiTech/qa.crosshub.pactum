import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateBlock from "@core/services/appointments/postCreateBlock.service"
import { validationsAG26 } from "@appointments-data/validations.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			validationsAG26.loginParams,
		)
	})

	it("[AG-26-F] - Bloqueio sem profissional nem serviço é recusado", async () => {
		const { json } = await postCreateBlock(
			{
				startsAt: validationsAG26.blockWindow.startsAt,
				endsAt: validationsAG26.blockWindow.endsAt,
			},
			validationsAG26.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(json.message),
			validationsAG26.errorMessage,
			"A mensagem do bloqueio sem alvo não é a especificada.",
		)
	})
})
