import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ICategoryInput } from "../../interface/catalog/ICatalog.interface"

/**
 * Atualiza uma categoria
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/categories/{id}`
 */
export default async function patchUpdateCategory(
	id: string,
	payload: ICategoryInput,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardCategories}/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/categories/{id} não é o esperado.`,
			)
	)
}
