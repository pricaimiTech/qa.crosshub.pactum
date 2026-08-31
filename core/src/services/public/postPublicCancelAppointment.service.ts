import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ICancelClientAppointment } from "../../interface/public/IPublic.interface"

/**
 * Cancela um agendamento do usuário final
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /public/me/appointments/{id}/cancel`
 */
export default async function postPublicCancelAppointment(
	id: string,
	payload: ICancelClientAppointment,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.publicMe}/appointments/${id}/cancel`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /public/me/appointments/{id}/cancel não é o esperado.`,
			)
	)
}
