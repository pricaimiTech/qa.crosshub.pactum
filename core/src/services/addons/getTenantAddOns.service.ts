import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Lista os add-ons contratados por uma organização
 * @param tenantId - tenantId
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /admin/add-ons/tenants/{tenantId}`
 */
export default async function getTenantAddOns(
	tenantId: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.adminAddOns}/tenants/${tenantId}`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /admin/add-ons/tenants/{tenantId} não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
