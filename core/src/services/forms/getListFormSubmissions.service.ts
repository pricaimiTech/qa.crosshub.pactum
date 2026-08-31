import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import { withQuery } from "../../utils/query.utils"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IGetListFormSubmissionsQuery } from "../../interface/forms/IForms.interface"

/**
 * Lista as respostas de um formulário
 * @param id - id
 * @param query - Filtros enviados na query string
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /dashboard/forms/{id}/submissions`
 */
export default async function getListFormSubmissions(
	id: string,
	query: IGetListFormSubmissionsQuery,
	paramsDefault: IParamsDefault,
) {
	return await (
		withQuery(specPactumJs().get(`${process.env.BASE_URL}${apiName.dashboardForms}/${id}/submissions`), query)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /dashboard/forms/{id}/submissions não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
