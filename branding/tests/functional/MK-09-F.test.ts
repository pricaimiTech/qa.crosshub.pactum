import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getPublicTenant from "@core/services/public/getPublicTenant.service"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { brandingMK09 } from "@branding-data/branding.data"

describe(describeName.public, () => {
	let adminParams: IParamsDefault
	let tenantSlug: string
	let displayName: string

	before("Marca salva no tenant do caso", async () => {
		const tenant = tenantFor(brandingMK09.caseId)

		tenantSlug = tenant.slug

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK09.loginParams,
		)

		const marca = brandingBuilder
			.withDisplayName(brandingMK09.casePrefix)
			.withAccentColor(brandingMK09.accentColor)
			.withThemeMode(brandingMK09.themeMode)
			.build()

		displayName = marca.displayName

		await putSaveBranding(
			marca,
			brandingMK09.paramsDefault200(adminParams.token),
		)
	})

	it("[MK-09-F] - O payload público reflete a marca salva, com o tema derivado", async () => {
		const { json } = await getPublicTenant(
			tenantSlug,
			brandingMK09.paramsDefault200(),
		)

		assertTs.equal(
			json.name,
			displayName,
			"O nome exibido na vitrine pública não é o salvo na marca.",
		)

		assertTs.equal(
			json.accentColor,
			brandingMK09.accentColor,
			"A cor de destaque publicada não é a salva na marca.",
		)

		assertTs.equal(
			json.themeMode,
			brandingMK09.themeMode,
			"O modo do tema publicado não é o salvo na marca.",
		)

		assertTs.exists(
			json.theme,
			"O payload público não trouxe o tema derivado — o app teria de recalcular a rampa.",
		)
	})
})
