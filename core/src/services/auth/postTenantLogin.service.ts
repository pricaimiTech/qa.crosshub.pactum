import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Autentica o administrador de uma organização (tenant)
 * @param slug - Slug do tenant
 * @param email - E-mail do administrador
 * @param password - Senha do administrador
 * @param paramsDefault - Parâmetros padrão da requisição
 * @rota POST /auth/platform/tenant/login
 * @returns Resposta com o accessToken do tenant
 */
export default async function postTenantLogin(
	slug: string | undefined,
	email: string | undefined,
	password: string | undefined,
	paramsDefault: IParamsDefault,
) {
	return await specPactumJs()
		.post(`${process.env.BASE_URL}${apiName.authPlatform}/tenant/login`)
		.withJson({
			slug: `${slug}`,
			email: `${email}`,
			password: `${password}`,
		})
		.expectStatus(
			paramsDefault.statusCode,
			`O status code da requisição ${apiName.authPlatform}/tenant/login não é o esperado.`,
		)

}
