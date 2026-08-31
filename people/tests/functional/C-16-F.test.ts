import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListPeople from "@core/services/people/getListPeople.service"
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { peopleC16 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC16.loginParams,
		)
	})

	it(`[C-16-F]${bugTag(peopleC16.knownBug)} - A listagem de clientes devolve tudo em uma resposta só, sem paginação`, async () => {
		const inicio = Date.now()

		const { json } = await getListPeople(
			peopleC16.paramsDefault200(adminParams.token),
		)

		const duracaoMs = Date.now() - inicio
		const tamanhoKb = Math.round(JSON.stringify(json).length / 1024)

		assertTs.isArray(
			json,
			"A listagem devolveu um envelope paginado — o contrato declara um array simples.",
		)

		// O caso é uma medição, não um limite: o número alimenta a decisão de
		// paginar. A asserção só falha quando o volume já passou do ponto em que
		// devolver tudo de uma vez deixa de ser aceitável.
		assertTs.isBelow(
			json.length,
			peopleC16.warningThreshold,
			bugMessage(
				`A base já tem ${json.length} clientes e a rota devolve todos em ${tamanhoKb} KB (${duracaoMs} ms). Sem paginação, a resposta cresce sem limite.`,
				peopleC16.knownBug,
			),
		)
	})
})
