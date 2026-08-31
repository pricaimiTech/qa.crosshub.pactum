import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISetSensitiveDataAccess } from "../../interface/privacy/IPrivacy.interface"

/**
 * Concede ou revoga acesso a dados sensíveis
 * @param userId - userId
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/privacy/professionals/{userId}/sensitive-data-access`
 */
export default async function patchSensitiveDataAccess(
	userId: string,
	payload: ISetSensitiveDataAccess,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardPrivacy}/professionals/${userId}/sensitive-data-access`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/privacy/professionals/{userId}/sensitive-data-access não é o esperado.`,
			)
	)
}
