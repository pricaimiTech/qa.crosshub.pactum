import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Obtém o perfil da sessão do usuário final
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /auth/platform/public/session`
 */
export default async function getPublicSession(
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.authPlatform}/public/session`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /auth/platform/public/session não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
