import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getHome from "@core/services/dashboard/getHome.service"
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { homeH04 } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			homeH04.loginParams,
		)
	})

	it(`[H-04-F]${bugTag(homeH04.knownBug)} - A Home oferece no máximo quatro ações, na ordem de prioridade`, async () => {
		const { json } = await getHome(homeH04.paramsDefault200(adminParams.token))

		assertTs.isAtMost(
			json.actions.length,
			homeH04.maxActions,
			"A Home ofereceu mais ações do que o limite especificado.",
		)

		const posicoes = json.actions.map((action: { priority: string }) =>
			homeH04.priorityOrder.indexOf(action.priority),
		)

		const desconhecidas = posicoes.filter((posicao: number) => posicao === -1)

		assertTs.deepEqual(
			desconhecidas,
			[],
			"Alguma ação veio com uma prioridade fora de high/medium/low.",
		)

		const foraDaOrdem = posicoes.filter(
			(posicao: number, indice: number) =>
				indice > 0 && posicao < posicoes[indice - 1],
		)

		assertTs.deepEqual(
			foraDaOrdem,
			[],
			bugMessage(
				`As ações não vêm da mais urgente para a menos urgente: ${json.actions
					.map((action: { priority: string }) => action.priority)
					.join(", ")}.`,
				homeH04.knownBug,
			),
		)
	})
})
