import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Identidade visual pública de uma organização
 * @param slug - slug
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /public/tenants/{slug}`
 */
export default async function getPublicTenant(
	slug: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.publicTenants}/${slug}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /public/tenants/{slug} não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
