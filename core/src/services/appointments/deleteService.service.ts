import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Exclui um serviço sem histórico de agendamentos
 * @param id - id
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `DELETE /dashboard/appointments/services/{id}`
 */
export default async function deleteService(
	id: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.delete(`${process.env.BASE_URL}${apiName.dashboardAppointments}/services/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição DELETE /dashboard/appointments/services/{id} não é o esperado.`,
			)
	)
}
