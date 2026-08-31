import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ICreateGroups } from "../../interface/groups/IGroups.interface"

/**
 * Cria um ou mais grupos
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/groups`
 */
export default async function postCreateGroup(
	payload: ICreateGroups,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardGroups}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/groups não é o esperado.`,
			)
	)
}
