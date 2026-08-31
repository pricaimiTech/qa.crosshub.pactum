import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Serve a imagem de um produto
 * @param tenantId - tenantId
 * @param file - Nome do arquivo, incluindo a extensão.
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /assets/tenants/{tenantId}/catalog/product/{file}`
 */
export default async function getProduct(
	tenantId: string,
	file: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.assets}/tenants/${tenantId}/catalog/product/${file}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /assets/tenants/{tenantId}/catalog/product/{file} não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
