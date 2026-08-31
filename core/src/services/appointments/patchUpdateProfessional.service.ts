import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateProfessional } from "../../interface/appointments/IAppointments.interface"

/**
 * Atualiza um profissional
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/appointments/professionals/{id}`
 */
export default async function patchUpdateProfessional(
	id: string,
	payload: IUpdateProfessional,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardAppointments}/professionals/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/appointments/professionals/{id} não é o esperado.`,
			)
	)
}
