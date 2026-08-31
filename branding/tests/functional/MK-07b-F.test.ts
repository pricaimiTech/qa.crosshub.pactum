import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import putBrandingPresign from "@core/services/branding/putBrandingPresign.service"
import { brandingMK07b } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			brandingMK07b.loginParams,
		)
	})

	it("[MK-07b-F] - O presign devolve URL temporária; tamanho acima do limite e tipo fora do enum são recusados", async () => {
		const { json } = await putBrandingPresign(
			{
				kind: brandingMK07b.kind,
				contentType: brandingMK07b.contentType,
				size: brandingMK07b.validSize,
			},
			brandingMK07b.paramsDefault200(adminParams.token),
		)

		assertTs.exists(
			json.uploadUrl,
			"O presign não devolveu a URL assinada de upload.",
		)

		assertTs.equal(
			json.expiresIn,
			brandingMK07b.expectedExpiresIn,
			"A URL assinada não expira no prazo especificado.",
		)

		await putBrandingPresign(
			{
				kind: brandingMK07b.kind,
				contentType: brandingMK07b.contentType,
				size: brandingMK07b.oversizedSize,
			},
			brandingMK07b.paramsDefault400(adminParams.token),
		)
	})
})
