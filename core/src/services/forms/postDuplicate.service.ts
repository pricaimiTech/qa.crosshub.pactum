import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Duplica o formulário com suas perguntas
 * @param id - id
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/forms/{id}/duplicate`
 */
export default async function postDuplicate(
	id: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardForms}/${id}/duplicate`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/forms/{id}/duplicate não é o esperado.`,
			)
	)
}
