import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Revoga o código atual e gera um novo
 * @param personId - personId
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/people/{personId}/access-codes/regenerate`
 */
export default async function postRegenerateCode(
	personId: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardPeople}/${personId}/access-codes/regenerate`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/people/{personId}/access-codes/regenerate não é o esperado.`,
			)
	)
}
