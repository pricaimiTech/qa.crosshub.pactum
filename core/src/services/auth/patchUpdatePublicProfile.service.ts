import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdatePublicProfileRequest } from "../../interface/auth/IAuth.interface"

/**
 * Atualiza o perfil do usuário final
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /auth/platform/public/me/profile`
 */
export default async function patchUpdatePublicProfile(
	payload: IUpdatePublicProfileRequest,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.authPlatform}/public/me/profile`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /auth/platform/public/me/profile não é o esperado.`,
			)
	)
}
