import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISubmitForm } from "../../interface/public/IPublic.interface"

/**
 * Envia as respostas de um formulário
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /public/forms/{id}/submissions`
 */
export default async function postPublicSubmitForm(
	id: string,
	payload: ISubmitForm,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.publicForms}/${id}/submissions`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /public/forms/{id}/submissions não é o esperado.`,
			)
	)
}
