import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IRequestInterest } from "../../interface/analytics/IAnalytics.interface"

/**
 * Registra interesse em contratar ou testar o Analytics
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/analytics/interest`
 */
export default async function postRequestAnalyticsInterest(
	payload: IRequestInterest,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardAnalytics}/interest`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/analytics/interest não é o esperado.`,
			)
	)
}
