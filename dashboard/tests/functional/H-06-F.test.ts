import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getHome from "@core/services/dashboard/getHome.service"
import { homeH06 } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado, com histórico farto no tenant", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			homeH06.loginParams,
		)
	})

	it("[H-06-F] - O feed vem limitado, em ordem decrescente e sem repetir id", async () => {
		const { json } = await getHome(homeH06.paramsDefault200(adminParams.token))

		assertTs.isAtMost(
			json.activities.length,
			homeH06.maxActivities,
			"O feed devolveu mais itens do que o limite especificado.",
		)

		const instantes = json.activities.map((activity: { occurredAt: string }) =>
			Date.parse(activity.occurredAt),
		)
		const foraDeOrdem = instantes.filter(
			(instante: number, indice: number) =>
				indice > 0 && instante > instantes[indice - 1],
		)

		assertTs.deepEqual(
			foraDeOrdem,
			[],
			"O feed não está em ordem decrescente por `occurredAt`.",
		)

		const ids = json.activities.map((activity: { id: string }) => activity.id)

		assertTs.equal(
			new Set(ids).size,
			ids.length,
			"O feed repetiu o mesmo id — a deduplicação não está funcionando.",
		)
	})
})
