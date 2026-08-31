import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateTenantAdmin } from "../../interface/tenants/ITenants.interface"

/**
 * Atualiza um administrador
 * @param id - id
 * @param userId - userId
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /admin/tenants/{id}/admins/{userId}`
 */
export default async function patchUpdateAdmin(
	id: string,
	userId: string,
	payload: IUpdateTenantAdmin,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.adminTenants}/${id}/admins/${userId}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /admin/tenants/{id}/admins/{userId} não é o esperado.`,
			)
	)
}
