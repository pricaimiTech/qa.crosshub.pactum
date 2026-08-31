import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateReservation } from "../../interface/catalog/ICatalog.interface"

/**
 * Altera o status de uma reserva
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/reservations/{id}`
 */
export default async function patchUpdateReservation(
	id: string,
	payload: IUpdateReservation,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardReservations}/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/reservations/{id} não é o esperado.`,
			)
	)
}
