import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISetTenantAdminStatus } from "../../interface/tenants/ITenants.interface"

/**
 * Ativa ou inativa um administrador
 * @param id - id
 * @param userId - userId
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /admin/tenants/{id}/admins/{userId}/status`
 */
export default async function patchSetAdminStatus(
	id: string,
	userId: string,
	payload: ISetTenantAdminStatus,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.adminTenants}/${id}/admins/${userId}/status`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /admin/tenants/{id}/admins/{userId}/status não é o esperado.`,
			)
	)
}
