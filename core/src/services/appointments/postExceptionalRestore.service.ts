import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IExceptionalCreditRestore } from "../../interface/appointments/IAppointments.interface"

/**
 * Devolve excepcionalmente o crédito de pacote consumido
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/appointments/{id}/package-credit/exceptional-restore`
 */
export default async function postExceptionalRestore(
	id: string,
	payload: IExceptionalCreditRestore,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardAppointments}/${id}/package-credit/exceptional-restore`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/appointments/{id}/package-credit/exceptional-restore não é o esperado.`,
			)
	)
}
