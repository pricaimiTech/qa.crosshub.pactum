import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISetPlanStatus } from "../../interface/plans/IPlans.interface"

/**
 * Ativa ou inativa um plano
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /admin/plans/{id}/status`
 */
export default async function patchPlanStatus(
	id: string,
	payload: ISetPlanStatus,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.adminPlans}/${id}/status`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /admin/plans/{id}/status não é o esperado.`,
			)
	)
}
