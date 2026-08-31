import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IEditAppointment } from "../../interface/appointments/IAppointments.interface"

/**
 * Edita cliente, serviço ou horário de um agendamento
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/appointments/{id}/edit`
 */
export default async function patchEditAppointment(
	id: string,
	payload: IEditAppointment,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardAppointments}/${id}/edit`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/appointments/{id}/edit não é o esperado.`,
			)
	)
}
