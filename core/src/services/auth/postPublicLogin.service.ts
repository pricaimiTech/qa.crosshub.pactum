import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IPublicLoginRequest } from "../../interface/auth/IAuth.interface"

/**
 * Autentica o usuário final
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /auth/platform/public/login`
 */
export default async function postPublicLogin(
	payload: IPublicLoginRequest,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.authPlatform}/public/login`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /auth/platform/public/login não é o esperado.`,
			)
	)
}
