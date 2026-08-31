import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ICreateReservation } from "../../interface/public/IPublic.interface"

/**
 * Reserva um produto
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /public/products/{id}/reservations`
 */
export default async function postPublicReserveProduct(
	id: string,
	payload: ICreateReservation,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.publicProducts}/${id}/reservations`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /public/products/{id}/reservations não é o esperado.`,
			)
	)
}
