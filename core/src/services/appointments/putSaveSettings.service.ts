import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISaveAppointmentSettings } from "../../interface/appointments/IAppointments.interface"

/**
 * Salva as configurações de agenda
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PUT /dashboard/appointments/settings`
 */
export default async function putSaveSettings(
	payload: ISaveAppointmentSettings,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.put(`${process.env.BASE_URL}${apiName.dashboardAppointments}/settings`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PUT /dashboard/appointments/settings não é o esperado.`,
			)
	)
}
