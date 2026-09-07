import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IBackdate } from "../../interface/fixtures/IFixtures.interface"

/**
 * Envelhece um registro do tenant (somente ambiente de teste)
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/test-fixtures/backdate`
 */
export default async function postBackdate(
	payload: IBackdate,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboard}/test-fixtures/backdate`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/test-fixtures/backdate não é o esperado.`,
			)
	)
}
