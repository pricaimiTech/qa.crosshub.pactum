import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Exclui um formulário e tudo que depende dele
 * @param id - id
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `DELETE /dashboard/forms/{id}`
 */
export default async function deleteForm(
	id: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.delete(`${process.env.BASE_URL}${apiName.dashboardForms}/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição DELETE /dashboard/forms/{id} não é o esperado.`,
			)
	)
}
