import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getSession from "@core/services/dashboard/getSession.service"
import { menuMN01 } from "@dashboard-data/menu.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			menuMN01.loginParams,
		)
	})

	it("[MN-01-F] - A sessão traz identidade e papel, mas não as flags de permissão", async () => {
		const { json } = await getSession(
			menuMN01.paramsDefault200(adminParams.token),
		)

		const ausentes = menuMN01.expectedFields.filter(
			(campo) => json[campo] === undefined,
		)

		assertTs.deepEqual(
			ausentes,
			[],
			"A sessão não devolveu algum dado de identidade que o painel espera.",
		)

		const vazadas = menuMN01.absentFields.filter(
			(campo) => json[campo] !== undefined,
		)

		assertTs.deepEqual(
			vazadas,
			[],
			"A sessão passou a devolver flags de permissão. Se isso for intencional, o menu pode montar a partir dela — hoje a fonte é GET /dashboard/privacy/professionals.",
		)
	})
})
