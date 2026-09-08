import { assertTs, preSetup } from "../../constants"
import type {
	IAddOn,
	ITenantAddOn,
} from "../../interface/addons/IAddons.interface"
import type { IParamsDefault } from "../../interface/global.interface"
import type { ITenantListItem } from "../../interface/tenants/ITenants.interface"
import getListAddOns from "../../services/addons/getListAddOns.service"
import putSaveTenantAddOns from "../../services/addons/putSaveTenantAddOns.service"
import getListTenants from "../../services/tenants/getListTenants.service"

/** Código estável do add-on de indicadores, como consta no catálogo. */
export const ANALYTICS_ADDON_CODE = "analytics"

export default class AddonsBusiness {
	/**
	 * Localiza um add-on do catálogo pelo código estável.
	 * @param code - Código do add-on (ex.: `analytics`)
	 * @param paramsDefault - Parâmetros padrão já autenticados como super admin
	 * @returns O add-on encontrado no catálogo
	 */
	public async addOnByCode(
		code: string,
		paramsDefault: IParamsDefault,
	): Promise<IAddOn> {
		const read200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const response = await getListAddOns(read200)
		const found = (response.json as Array<IAddOn>).filter(
			(addOn) => addOn.code === code,
		)

		assertTs.equal(
			found.length,
			1,
			`O catálogo de add-ons não tem exatamente um add-on com código "${code}".`,
		)

		return found[0]
	}

	/**
	 * Id de um tenant a partir do slug, pela listagem do super admin.
	 * @param slug - Slug do tenant
	 * @param paramsDefault - Parâmetros padrão já autenticados como super admin
	 * @returns Id do tenant
	 */
	public async tenantIdBySlug(
		slug: string,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const read200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const response = await getListTenants(read200)
		const found = (response.json as Array<ITenantListItem>).filter(
			(tenant) => tenant.slug === slug,
		)

		assertTs.equal(found.length, 1, `Tenant "${slug}" não encontrado.`)

		return found[0].id
	}

	/**
	 * Define o status de um add-on para o tenant, com o preço de referência do
	 * catálogo. `active` sem `endsAt` não expira; `inactive` desliga o gate.
	 *
	 * Ativar também marca como atendidos os pedidos de interesse pendentes do
	 * mesmo add-on — é o jeito de zerar a idempotência de 7 dias entre execuções.
	 * @param tenantId - Tenant alvo
	 * @param code - Código do add-on
	 * @param status - Status desejado
	 * @param paramsDefault - Parâmetros padrão já autenticados como super admin
	 * @returns Vínculo tenant–add-on devolvido pela API
	 */
	public async setAddOnStatus(
		tenantId: string,
		code: string,
		status: "active" | "trial" | "inactive",
		paramsDefault: IParamsDefault,
	): Promise<ITenantAddOn> {
		const updated200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const addOn = await this.addOnByCode(code, paramsDefault)
		const trialEndsAt =
			status === "trial"
				? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
				: undefined

		const response = await putSaveTenantAddOns(
			tenantId,
			{
				addOnId: addOn.id,
				status,
				referencePriceCents: addOn.priceCents,
				...(trialEndsAt ? { trialEndsAt } : {}),
			},
			updated200,
		)

		return response.json as ITenantAddOn
	}
}
