import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ISaveTenantAddOn } from "../../interface/addons/IAddons.interface"

/**
 * Contrata ou atualiza um add-on da organização
 * @param tenantId - tenantId
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PUT /admin/add-ons/tenants/{tenantId}`
 */
export default async function putSaveTenantAddOns(
	tenantId: string,
	payload: ISaveTenantAddOn,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.put(`${process.env.BASE_URL}${apiName.adminAddOns}/tenants/${tenantId}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PUT /admin/add-ons/tenants/{tenantId} não é o esperado.`,
			)
	)
}
