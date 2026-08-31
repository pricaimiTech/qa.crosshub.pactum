import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdatePublicPasswordRequest } from "../../interface/auth/IAuth.interface"

/**
 * Altera o PIN do usuário final
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /auth/platform/public/me/password`
 */
export default async function patchUpdatePublicPassword(
	payload: IUpdatePublicPasswordRequest,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.authPlatform}/public/me/password`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /auth/platform/public/me/password não é o esperado.`,
			)
	)
}
