import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Autentica o super admin da plataforma
 * @param email - E-mail do super admin
 * @param password - Senha do super admin
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta com o accessToken da plataforma
 */
export default async function postPlatformLogin(
	email: string | undefined,
	password: string | undefined,
	paramsDefault: IParamsDefault,
) {
	return await specPactumJs()
		.post(`${process.env.BASE_URL}${apiName.authPlatform}/login`)
		.withJson({
			email: `${email}`,
			password: `${password}`,
		})
		.expectStatus(
			paramsDefault.statusCode,
			`O status code da requisição ${apiName.authPlatform}/login não é o esperado.`,
		)
		.retry({
			count: paramsDefault.retry.count,
			delay: paramsDefault.retry.delay,
			strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
		})
}
