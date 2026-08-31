import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateTenant } from "../../interface/tenants/ITenants.interface"

/**
 * Atualiza uma organização
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /admin/tenants/{id}`
 */
export default async function patchUpdateTenant(
	id: string,
	payload: IUpdateTenant,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.adminTenants}/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /admin/tenants/{id} não é o esperado.`,
			)
	)
}
