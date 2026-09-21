import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Gera uma senha provisória para um administrador
 * @param id - id
 * @param userId - userId
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /admin/tenants/{id}/admins/{userId}/provisional-password`
 */
export default async function postIssueProvisionalPassword(
	id: string,
	userId: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.adminTenants}/${id}/admins/${userId}/provisional-password`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /admin/tenants/{id}/admins/{userId}/provisional-password não é o esperado.`,
			)
	)
}
