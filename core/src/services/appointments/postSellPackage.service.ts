import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISellPackage } from "../../interface/appointments/IAppointments.interface"

/**
 * Vende um pacote para uma pessoa
 * @param personId - personId
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/appointments/people/{personId}/packages`
 */
export default async function postSellPackage(
	personId: string,
	payload: ISellPackage,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardAppointments}/people/${personId}/packages`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/appointments/people/{personId}/packages não é o esperado.`,
			)
	)
}
