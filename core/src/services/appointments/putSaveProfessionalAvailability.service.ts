import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISaveAvailability } from "../../interface/appointments/IAppointments.interface"

/**
 * Substitui a grade de horários de um profissional
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PUT /dashboard/appointments/professionals/{id}/availability`
 */
export default async function putSaveProfessionalAvailability(
	id: string,
	payload: ISaveAvailability,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.put(`${process.env.BASE_URL}${apiName.dashboardAppointments}/professionals/${id}/availability`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PUT /dashboard/appointments/professionals/{id}/availability não é o esperado.`,
			)
	)
}
