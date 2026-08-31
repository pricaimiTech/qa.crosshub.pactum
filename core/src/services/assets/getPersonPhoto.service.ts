import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Serve a foto de uma pessoa
 * @param tenantId - tenantId
 * @param file - Nome do arquivo, incluindo a extensão.
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /assets/tenants/{tenantId}/people/photo/{file}`
 */
export default async function getPersonPhoto(
	tenantId: string,
	file: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.assets}/tenants/${tenantId}/people/photo/${file}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /assets/tenants/{tenantId}/people/photo/{file} não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
