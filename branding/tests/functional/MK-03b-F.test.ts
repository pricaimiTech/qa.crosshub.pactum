import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { brandingMK03b } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant reservado ao caso", async () => {
		const tenant = tenantFor(brandingMK03b.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK03b.loginParams,
		)
	})

	it("[MK-03b-F] - A resposta traz o tema derivado pronto: semente, rampas e tokens CSS", async () => {
		const { json } = await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK03b.casePrefix)
				.withAccentColor(brandingMK03b.accentColor)
				.withThemeMode(brandingMK03b.themeMode)
				.build(),
			brandingMK03b.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.theme.seed,
			brandingMK03b.accentColor,
			"O tema derivado não ecoa a cor de destaque enviada como semente.",
		)

		assertTs.exists(
			json.theme.neutral,
			"O tema derivado não trouxe a rampa neutra — o cliente teria de recalcular.",
		)

		assertTs.exists(
			json.theme.accent,
			"O tema derivado não trouxe a rampa de destaque.",
		)

		assertTs.isAbove(
			Object.keys(json.theme.tokens).length,
			0,
			"O tema derivado não trouxe os tokens CSS.",
		)
	})
})
