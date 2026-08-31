import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Exclui um profissional sem histórico de agendamentos
 * @param id - id
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `DELETE /dashboard/appointments/professionals/{id}`
 */
export default async function deleteProfessional(
	id: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.delete(`${process.env.BASE_URL}${apiName.dashboardAppointments}/professionals/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição DELETE /dashboard/appointments/professionals/{id} não é o esperado.`,
			)
	)
}
