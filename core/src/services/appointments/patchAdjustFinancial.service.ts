import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IAdjustFinancial } from "../../interface/appointments/IAppointments.interface"

/**
 * Aplica desconto, acréscimo ou isenção
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/appointments/{id}/financial`
 */
export default async function patchAdjustFinancial(
	id: string,
	payload: IAdjustFinancial,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardAppointments}/${id}/financial`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/appointments/{id}/financial não é o esperado.`,
			)
	)
}
