import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Publica o formulário para o público já atribuído
 * @param id - id
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/forms/{id}/publish`
 */
export default async function postPublish(
	id: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardForms}/${id}/publish`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/forms/{id}/publish não é o esperado.`,
			)
	)
}
