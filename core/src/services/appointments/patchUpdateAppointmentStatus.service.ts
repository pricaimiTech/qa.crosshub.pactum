import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateAppointmentStatus } from "../../interface/appointments/IAppointments.interface"

/**
 * Altera o status de um agendamento
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/appointments/{id}`
 */
export default async function patchUpdateAppointmentStatus(
	id: string,
	payload: IUpdateAppointmentStatus,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardAppointments}/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/appointments/{id} não é o esperado.`,
			)
	)
}
