import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IResetTenantAdminPassword } from "../../interface/tenants/ITenants.interface"

/**
 * Redefine a senha de um administrador
 * @param id - id
 * @param userId - userId
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /admin/tenants/{id}/admins/{userId}/password`
 */
export default async function patchResetAdminPassword(
	id: string,
	userId: string,
	payload: IResetTenantAdminPassword,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.adminTenants}/${id}/admins/${userId}/password`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /admin/tenants/{id}/admins/{userId}/password não é o esperado.`,
			)
	)
}
