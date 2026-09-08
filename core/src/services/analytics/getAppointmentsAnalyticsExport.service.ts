import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import { withQuery } from "../../utils/query.utils"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IGetAppointmentsAnalyticsExportQuery } from "../../interface/analytics/IAnalytics.interface"

/**
 * Exporta os atendimentos do período em CSV
 * @param query - Filtros enviados na query string
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /dashboard/analytics/appointments/export`
 */
export default async function getAppointmentsAnalyticsExport(
	query: IGetAppointmentsAnalyticsExportQuery,
	paramsDefault: IParamsDefault,
) {
	return await (
		withQuery(specPactumJs().get(`${process.env.BASE_URL}${apiName.dashboardAnalytics}/appointments/export`), query)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /dashboard/analytics/appointments/export não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
