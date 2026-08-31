import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getHome from "@core/services/dashboard/getHome.service"
import { homeH03 } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			homeH03.loginParams,
		)
	})

	it("[H-03-F] - As janelas da Home são deslizantes: 24 h e 7 dias antes da geração", async () => {
		const { json } = await getHome(homeH03.paramsDefault200(adminParams.token))

		const geradoEm = Date.parse(json.generatedAt)
		const recentes = Date.parse(json.periods.recentSince)
		const pessoas = Date.parse(json.periods.peopleSince)

		const janelaRecente = geradoEm - recentes
		const janelaPessoas = geradoEm - pessoas

		assertTs.closeTo(
			janelaRecente,
			homeH03.recentWindowHours * 60 * 60 * 1000,
			homeH03.toleranceMs,
			"`recentSince` não fica exatamente 24 h antes de `generatedAt`.",
		)

		assertTs.closeTo(
			janelaPessoas,
			homeH03.peopleWindowDays * 24 * 60 * 60 * 1000,
			homeH03.toleranceMs,
			"`peopleSince` não fica exatamente 7 dias antes de `generatedAt`.",
		)
	})
})
