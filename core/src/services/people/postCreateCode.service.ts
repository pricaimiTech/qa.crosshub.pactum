import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Gera o código de acesso da pessoa
 * @param personId - personId
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/people/{personId}/access-codes`
 */
export default async function postCreateCode(
	personId: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardPeople}/${personId}/access-codes`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/people/{personId}/access-codes não é o esperado.`,
			)
	)
}
