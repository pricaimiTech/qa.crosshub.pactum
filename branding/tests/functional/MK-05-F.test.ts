import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postUploadBranding from "@core/services/branding/postUploadBranding.service"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { writeJpeg } from "@core/utils/file.utils"
import { tenantFor } from "@core/utils/tenant.utils"
import { brandingMK05 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let logoKey: string

	before("Marca com logo enviada", async () => {
		const tenant = tenantFor(brandingMK05.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK05.loginParams,
		)

		const upload = await postUploadBranding(
			writeJpeg("marca-logo.jpg", brandingMK05.logoBytes),
			brandingMK05.kind,
			brandingMK05.paramsDefault201(adminParams.token),
		)

		logoKey = upload.json.key

		await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK05.casePrefix)
				.withLogoKey(logoKey)
				.build(),
			brandingMK05.paramsDefault200(adminParams.token),
		)
	})

	it("[MK-05-F] - Omitir a logo preserva o ativo; enviar null é que remove", async () => {
		const omitindo = await putSaveBranding(
			brandingBuilder.withDisplayName(brandingMK05.casePrefix).build(),
			brandingMK05.paramsDefault200(adminParams.token),
		)

		assertTs.exists(
			omitindo.json.logoUrl,
			"Omitir `logoKey` removeu a logo — omitir não é remover.",
		)

		const removendo = await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK05.casePrefix)
				.withLogoKey(null)
				.build(),
			brandingMK05.paramsDefault200(adminParams.token),
		)

		assertTs.isNull(
			removendo.json.logoUrl,
			"Enviar `logoKey: null` não removeu a logo.",
		)
	})
})
