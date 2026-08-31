import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IPublicActivationRequest } from "../../interface/auth/IAuth.interface"

/**
 * Ativa a conta do usuário final com código de acesso
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /auth/platform/public/activate`
 */
export default async function postActivate(
	payload: IPublicActivationRequest,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.authPlatform}/public/activate`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /auth/platform/public/activate não é o esperado.`,
			)
	)
}
