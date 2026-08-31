import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Remove um bloqueio de agenda
 * @param id - id
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `DELETE /dashboard/appointments/blocks/{id}`
 */
export default async function deleteBlock(
	id: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.delete(`${process.env.BASE_URL}${apiName.dashboardAppointments}/blocks/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição DELETE /dashboard/appointments/blocks/{id} não é o esperado.`,
			)
	)
}
