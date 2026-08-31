import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateProduct } from "../../interface/catalog/ICatalog.interface"

/**
 * Atualiza um produto
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/products/{id}`
 */
export default async function patchUpdateProduct(
	id: string,
	payload: IUpdateProduct,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardProducts}/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/products/{id} não é o esperado.`,
			)
	)
}
