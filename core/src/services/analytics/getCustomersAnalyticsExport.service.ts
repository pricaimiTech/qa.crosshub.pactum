import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import { withQuery } from "../../utils/query.utils"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IGetCustomersAnalyticsExportQuery } from "../../interface/analytics/IAnalytics.interface"

/**
 * Exporta os clientes ativos do período em CSV
 * @param query - Filtros enviados na query string
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /dashboard/analytics/customers/export`
 */
export default async function getCustomersAnalyticsExport(
	query: IGetCustomersAnalyticsExportQuery,
	paramsDefault: IParamsDefault,
) {
	return await (
		withQuery(specPactumJs().get(`${process.env.BASE_URL}${apiName.dashboardAnalytics}/customers/export`), query)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /dashboard/analytics/customers/export não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
