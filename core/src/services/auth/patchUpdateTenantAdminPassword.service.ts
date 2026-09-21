import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateTenantAdminPasswordRequest } from "../../interface/auth/IAuth.interface"

/**
 * Altera a própria senha do administrador da organização
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /auth/platform/tenant/me/password`
 */
export default async function patchUpdateTenantAdminPassword(
	payload: IUpdateTenantAdminPasswordRequest,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.authPlatform}/tenant/me/password`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /auth/platform/tenant/me/password não é o esperado.`,
			)
	)
}
