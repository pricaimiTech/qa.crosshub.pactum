import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListPeople from "@core/services/people/getListPeople.service"
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

	it(`[C-16-F] - A listagem de clientes pagina quando pedida e mantém o array quando não`, async () => {
		const pagina = await getListPeople(
			{ page: 1, pageSize: peopleC16.pageSize },
			peopleC16.paramsDefault200(adminParams.token),
		)

		assertTs.isArray(
			pagina.json.items,
			"Com page/pageSize a resposta não veio no envelope paginado.",
		)

		assertTs.isAtMost(
			pagina.json.items.length,
			peopleC16.pageSize,
			"A página trouxe mais itens que o pageSize pedido.",
		)

		assertTs.equal(pagina.json.page, 1, "O envelope não ecoa a página pedida.")
		assertTs.equal(pagina.json.pageSize, peopleC16.pageSize, "O envelope não ecoa o pageSize pedido.")
		assertTs.isAtLeast(pagina.json.total, pagina.json.items.length, "`total` é menor que a própria página.")
		assertTs.equal(
			pagina.json.totalPages,
			Math.ceil(pagina.json.total / peopleC16.pageSize),
			"`totalPages` não confere com total / pageSize.",
		)

		// Período de compatibilidade: sem parâmetros, o array de sempre — até o
		// dashboard migrar para o envelope.
		const tudo = await getListPeople({}, peopleC16.paramsDefault200(adminParams.token))

		assertTs.isArray(
			tudo.json,
			"Sem page/pageSize a resposta deixou de ser o array — o dashboard ainda depende dele.",
		)
		// O tenant é compartilhado e outros casos criam pessoas entre as duas
		// chamadas, então o array só pode ter crescido em relação ao `total`
		// da página — nunca comparar dois totais globais por igualdade.
		assertTs.isAtLeast(
			tudo.json.length,
			pagina.json.total,
			"O array completo trouxe menos pessoas que o `total` paginado.",
		)
	})

	it(`[C-16-F] - pageSize acima do máximo é recusado`, async () => {
		await getListPeople(
			{ pageSize: peopleC16.pageSize * 100 },
			peopleC16.paramsDefault400(adminParams.token),
		)
	})
})
