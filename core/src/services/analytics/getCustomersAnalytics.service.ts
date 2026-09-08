import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import { withQuery } from "../../utils/query.utils"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IGetCustomersAnalyticsQuery } from "../../interface/analytics/IAnalytics.interface"

/**
 * Indicadores da aba Clientes
 * @param query - Filtros enviados na query string
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /dashboard/analytics/customers`
 */
export default async function getCustomersAnalytics(
	query: IGetCustomersAnalyticsQuery,
	paramsDefault: IParamsDefault,
) {
	return await (
		withQuery(specPactumJs().get(`${process.env.BASE_URL}${apiName.dashboardAnalytics}/customers`), query)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /dashboard/analytics/customers não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
