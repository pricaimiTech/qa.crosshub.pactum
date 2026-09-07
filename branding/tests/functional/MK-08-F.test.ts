import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getBranding from "@core/services/branding/getBranding.service"
import patchBannerSettings from "@core/services/banners/patchBannerSettings.service"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { brandingMK08 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Carrossel configurado no tenant do caso", async () => {
		const tenant = tenantFor(brandingMK08.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK08.loginParams,
		)

		await patchBannerSettings(
			brandingMK08.carousel,
			brandingMK08.paramsDefault200(adminParams.token),
		)
	})

	it(`[MK-08-F] - Salvar a marca não zera as configurações do carrossel`, async () => {
		await putSaveBranding(
			brandingBuilder.withDisplayName(brandingMK08.casePrefix).build(),
			brandingMK08.paramsDefault200(adminParams.token),
		)

		const { json } = await getBranding(
			brandingMK08.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.carouselInterval,
			brandingMK08.carousel.interval,
			"O intervalo do carrossel foi perdido ao salvar a marca.",
		)

		assertTs.equal(
			json.carouselHeight,
			brandingMK08.carousel.height,
			"A altura do carrossel foi perdida ao salvar a marca.",
		)

		assertTs.equal(
			json.carouselShowIndicators,
			brandingMK08.carousel.showIndicators,
			"A exibição de indicadores do carrossel foi perdida ao salvar a marca.",
		)
	})
})
