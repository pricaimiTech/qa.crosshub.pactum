import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateGroup } from "../../interface/groups/IGroups.interface"

/**
 * Atualiza um grupo
 * @param groupId - groupId
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/groups/{groupId}`
 */
export default async function patchUpdateGroup(
	groupId: string,
	payload: IUpdateGroup,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardGroups}/${groupId}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/groups/{groupId} não é o esperado.`,
			)
	)
}
