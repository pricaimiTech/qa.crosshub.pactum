import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Lista as reservas com dados do produto e do cliente
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /dashboard/reservations`
 */
export default async function getReservations(
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.dashboardReservations}`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /dashboard/reservations não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
