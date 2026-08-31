import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ICreatePackage } from "../../interface/appointments/IAppointments.interface"

/**
 * Cria um pacote de crédito
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/appointments/packages`
 */
export default async function postCreatePackage(
	payload: ICreatePackage,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardAppointments}/packages`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/appointments/packages não é o esperado.`,
			)
	)
}
