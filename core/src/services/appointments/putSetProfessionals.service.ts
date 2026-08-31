import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISetServiceProfessionals } from "../../interface/appointments/IAppointments.interface"

/**
 * Substitui os profissionais habilitados em um serviço
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PUT /dashboard/appointments/services/{id}/professionals`
 */
export default async function putSetProfessionals(
	id: string,
	payload: ISetServiceProfessionals,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.put(`${process.env.BASE_URL}${apiName.dashboardAppointments}/services/${id}/professionals`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PUT /dashboard/appointments/services/{id}/professionals não é o esperado.`,
			)
	)
}
