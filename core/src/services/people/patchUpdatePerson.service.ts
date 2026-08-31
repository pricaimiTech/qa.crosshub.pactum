import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdatePerson } from "../../interface/people/IPeople.interface"

/**
 * Atualiza uma pessoa
 * @param personId - personId
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/people/{personId}`
 */
export default async function patchUpdatePerson(
	personId: string,
	payload: IUpdatePerson,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardPeople}/${personId}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/people/{personId} não é o esperado.`,
			)
	)
}
