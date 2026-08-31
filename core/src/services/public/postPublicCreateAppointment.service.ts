import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ICreateClientAppointment } from "../../interface/public/IPublic.interface"

/**
 * Cria um agendamento pelo app do usuário final
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /public/appointments`
 */
export default async function postPublicCreateAppointment(
	payload: ICreateClientAppointment,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.publicAppointments}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /public/appointments não é o esperado.`,
			)
	)
}
