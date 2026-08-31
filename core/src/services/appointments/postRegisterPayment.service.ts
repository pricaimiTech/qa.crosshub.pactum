import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IRegisterPayment } from "../../interface/appointments/IAppointments.interface"

/**
 * Registra um pagamento do agendamento
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/appointments/{id}/payments`
 */
export default async function postRegisterPayment(
	id: string,
	payload: IRegisterPayment,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardAppointments}/${id}/payments`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/appointments/{id}/payments não é o esperado.`,
			)
	)
}
