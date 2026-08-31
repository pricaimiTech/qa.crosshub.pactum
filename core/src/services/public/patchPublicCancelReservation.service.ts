import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ICancelReservation } from "../../interface/public/IPublic.interface"

/**
 * Cancela a própria reserva
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /public/me/reservations/{id}/cancel`
 */
export default async function patchPublicCancelReservation(
	id: string,
	payload: ICancelReservation,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.publicMe}/reservations/${id}/cancel`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /public/me/reservations/{id}/cancel não é o esperado.`,
			)
	)
}
