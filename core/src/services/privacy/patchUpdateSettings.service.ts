import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdatePrivacySettings } from "../../interface/privacy/IPrivacy.interface"

/**
 * Atualiza a política de retenção
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/privacy/settings`
 */
export default async function patchUpdateSettings(
	payload: IUpdatePrivacySettings,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardPrivacy}/settings`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/privacy/settings não é o esperado.`,
			)
	)
}
