import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IRegisterPayment } from "../../interface/appointments/IAppointments.interface"

/**
 * Registra um pagamento de um contrato de pacote
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/appointments/package-contracts/{id}/payments`
 */
export default async function postContractPayment(
	id: string,
	payload: IRegisterPayment,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardAppointments}/package-contracts/${id}/payments`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/appointments/package-contracts/{id}/payments não é o esperado.`,
			)
	)
}
