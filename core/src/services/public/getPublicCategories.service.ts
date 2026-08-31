import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Categorias públicas de uma organização
 * @param slug - slug
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /public/tenants/{slug}/categories`
 */
export default async function getPublicCategories(
	slug: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.publicTenants}/${slug}/categories`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /public/tenants/{slug}/categories não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
