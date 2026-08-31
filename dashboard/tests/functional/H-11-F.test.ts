import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getSession from "@core/services/dashboard/getSession.service"
import { homeH11 } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			homeH11.loginParams,
		)
	})

	it("[H-11-F] - A sessão do painel reflete o e-mail, o tenant e o papel do token", async () => {
		const { json } = await getSession(
			homeH11.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.email,
			`${process.env.TENANT_EMAIL}`,
			"A sessão não devolveu o e-mail do administrador autenticado.",
		)

		assertTs.equal(
			json.role,
			homeH11.expectedRole,
			"A sessão não devolveu o papel tenant_admin.",
		)

		assertTs.exists(
			json.tenantId,
			"A sessão não devolveu o tenantId.",
		)
	})
})
