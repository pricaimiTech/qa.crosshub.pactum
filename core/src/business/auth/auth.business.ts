import { assertTs, preSetup } from "../../constants"
import type { IParamsDefault } from "../../interface/global.interface"
import postPlatformLogin from "../../services/auth/postPlatformLogin.service"
import postTenantLogin from "../../services/auth/postTenantLogin.service"

export default class AuthBusiness {
	/**
	 * Autentica o super admin da plataforma e devolve os params já com o Bearer token
	 * @param email - E-mail do super admin
	 * @param password - Senha do super admin
	 * @param paramsDefault - Parâmetros padrão da requisição de login
	 * @returns Novos params contendo o accessToken obtido
	 */
	public async loginAsPlatformAdmin(
		email: string,
		password: string,
		paramsDefault: IParamsDefault,
	): Promise<IParamsDefault> {
		const response = await postPlatformLogin(email, password, paramsDefault)

		assertTs.isNotNull(
			response.json.accessToken,
			"Login da plataforma não retornou accessToken.",
		)

		return preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			response.json.accessToken,
		)
	}

	/**
	 * Autentica o admin do tenant e devolve os params já com o Bearer token
	 * @param slug - Slug do tenant
	 * @param email - E-mail do administrador
	 * @param password - Senha do administrador
	 * @param paramsDefault - Parâmetros padrão da requisição de login
	 * @returns Novos params contendo o accessToken obtido
	 */
	public async loginAsTenantAdmin(
		slug: string,
		email: string,
		password: string,
		paramsDefault: IParamsDefault,
	): Promise<IParamsDefault> {
		const response = await postTenantLogin(slug, email, password, paramsDefault)

		assertTs.isNotNull(
			response.json.accessToken,
			"Login do tenant não retornou accessToken.",
		)

		return preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			response.json.accessToken,
		)
	}
}
