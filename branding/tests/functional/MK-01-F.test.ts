import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getBranding from "@core/services/branding/getBranding.service"
import { tenantFor } from "@core/utils/tenant.utils"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { brandingMK01 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant reservado ao caso", async () => {
		// A marca é uma linha única por tenant: cada caso deste módulo escreve no
		// seu próprio tenant para não sobrescrever o vizinho em paralelo.
		const tenant = tenantFor(brandingMK01.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK01.loginParams,
		)
	})

	it("[MK-01-F] - Dois PUT seguidos deixam uma linha só, com o conteúdo do segundo", async () => {
		await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK01.casePrefix)
				.withAccentColor(brandingMK01.firstColor)
				.build(),
			brandingMK01.paramsDefault200(adminParams.token),
		)

		const segundo = brandingBuilder
			.withDisplayName(brandingMK01.casePrefix)
			.withAccentColor(brandingMK01.secondColor)
			.withThemeMode(brandingMK01.secondTheme)
			.build()

		await putSaveBranding(
			segundo,
			brandingMK01.paramsDefault200(adminParams.token),
		)

		const { json } = await getBranding(
			brandingMK01.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.displayName,
			segundo.displayName,
			"A marca não guardou o conteúdo do segundo PUT.",
		)

		assertTs.equal(
			json.accentColor,
			brandingMK01.secondColor,
			"A cor de destaque não foi sobrescrita pelo segundo PUT.",
		)

		assertTs.equal(
			json.themeMode,
			brandingMK01.secondTheme,
			"O modo do tema não foi sobrescrito pelo segundo PUT.",
		)
	})
})
