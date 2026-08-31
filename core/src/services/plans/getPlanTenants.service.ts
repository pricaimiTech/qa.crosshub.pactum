import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Lista as organizações que usam um plano
 * @param id - id
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /admin/plans/{id}/tenants`
 */
export default async function getPlanTenants(
	id: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.adminPlans}/${id}/tenants`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /admin/plans/{id}/tenants não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
