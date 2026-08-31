import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ICreateTenantAdmin } from "../../interface/tenants/ITenants.interface"

/**
 * Cria um administrador para a organização
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /admin/tenants/{id}/admins`
 */
export default async function postCreateAdmin(
	id: string,
	payload: ICreateTenantAdmin,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.adminTenants}/${id}/admins`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /admin/tenants/{id}/admins não é o esperado.`,
			)
	)
}
