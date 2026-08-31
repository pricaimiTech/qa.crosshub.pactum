import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Serve o logo, a capa ou a imagem de banner de uma organização
 * @param tenantId - tenantId
 * @param kind - kind
 * @param file - Nome do arquivo, incluindo a extensão.
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /assets/tenants/{tenantId}/branding/{kind}/{file}`
 */
export default async function getBranding(
	tenantId: string,
	kind: string,
	file: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.assets}/tenants/${tenantId}/branding/${kind}/${file}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /assets/tenants/{tenantId}/branding/{kind}/{file} não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
