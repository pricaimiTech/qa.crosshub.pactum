import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Obtém a política de retenção de dados sensíveis
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /dashboard/privacy/settings`
 */
export default async function getSettings(
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.dashboardPrivacy}/settings`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /dashboard/privacy/settings não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
