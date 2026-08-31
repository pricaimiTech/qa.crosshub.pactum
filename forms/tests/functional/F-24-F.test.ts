import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListAllSubmissions from "@core/services/forms/getListAllSubmissions.service"
import { formsF24 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF24.loginParams,
		)
	})

	it("[F-24-F] - /dashboard/forms/submissions resolve para a lista, não para o formulário de id 'submissions'", async () => {
		const { json } = await getListAllSubmissions(
			{},
			formsF24.paramsDefault200(adminParams.token),
		)

		assertTs.isArray(
			json.items,
			"A rota literal não devolveu a página de submissões — a rota com parâmetro capturou o caminho.",
		)

		assertTs.isNumber(
			json.total,
			"A resposta não tem o agregado `total` da página de submissões.",
		)
	})
})
