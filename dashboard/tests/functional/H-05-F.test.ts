import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getHome from "@core/services/dashboard/getHome.service"
import { homeH05 } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			homeH05.loginParams,
		)
	})

	it("[H-05-F] - Nenhuma ação da Home vem com contagem zero", async () => {
		const { json } = await getHome(homeH05.paramsDefault200(adminParams.token))

		const zeradas = json.actions.filter(
			(action: { count: number }) => action.count === 0,
		)

		assertTs.deepEqual(
			zeradas,
			[],
			"A Home ofereceu um card com contagem zero — não há o que fazer nele.",
		)
	})
})
