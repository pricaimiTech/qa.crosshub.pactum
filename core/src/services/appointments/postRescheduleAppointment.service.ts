import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IRescheduleAppointment } from "../../interface/appointments/IAppointments.interface"

/**
 * Remarca um agendamento
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/appointments/{id}/reschedule`
 */
export default async function postRescheduleAppointment(
	id: string,
	payload: IRescheduleAppointment,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardAppointments}/${id}/reschedule`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/appointments/{id}/reschedule não é o esperado.`,
			)
	)
}
