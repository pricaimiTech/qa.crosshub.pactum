import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import { withQuery } from "../../utils/query.utils"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IGetAvailabilityQuery } from "../../interface/appointments/IAppointments.interface"

/**
 * Horários livres de um serviço em uma data
 * @param query - Filtros enviados na query string
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /dashboard/appointments/availability`
 */
export default async function getAvailability(
	query: IGetAvailabilityQuery,
	paramsDefault: IParamsDefault,
) {
	return await (
		withQuery(specPactumJs().get(`${process.env.BASE_URL}${apiName.dashboardAppointments}/availability`), query)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /dashboard/appointments/availability não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
