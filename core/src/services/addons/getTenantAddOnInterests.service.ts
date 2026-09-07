import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Pedidos de interesse pendentes da organização (AN-06)
 * @param tenantId - tenantId
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /admin/add-ons/tenants/{tenantId}/interests`
 */
export default async function getTenantAddOnInterests(
	tenantId: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.adminAddOns}/tenants/${tenantId}/interests`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /admin/add-ons/tenants/{tenantId}/interests não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
