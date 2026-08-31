import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISaveBranding } from "../../interface/branding/IBranding.interface"

/**
 * Salva a identidade visual
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PUT /dashboard/branding`
 */
export default async function putSaveBranding(
	payload: ISaveBranding,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.put(`${process.env.BASE_URL}${apiName.dashboardBranding}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PUT /dashboard/branding não é o esperado.`,
			)
	)
}
