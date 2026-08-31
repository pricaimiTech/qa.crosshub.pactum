import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IReplaceQuestions } from "../../interface/forms/IForms.interface"

/**
 * Substitui todas as perguntas de um formulário
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PUT /dashboard/forms/{id}/questions`
 */
export default async function putReplaceQuestions(
	id: string,
	payload: IReplaceQuestions,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.put(`${process.env.BASE_URL}${apiName.dashboardForms}/${id}/questions`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PUT /dashboard/forms/{id}/questions não é o esperado.`,
			)
	)
}
