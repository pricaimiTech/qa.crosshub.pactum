import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getBrandingAsset from "@core/services/assets/getBranding.service"
import postUploadBranding from "@core/services/branding/postUploadBranding.service"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { writeJpeg } from "@core/utils/file.utils"
import { tenantFor } from "@core/utils/tenant.utils"
import { brandingMK04 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let tenantId: string
	let arquivoAntigo: string

	before("Marca com a primeira logo salva", async () => {
		const tenant = tenantFor(brandingMK04.caseId)
		tenantId = tenant.tenantId

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK04.loginParams,
		)

		const primeira = await postUploadBranding(
			writeJpeg("marca-logo-antiga.jpg", brandingMK04.primeiraLogoBytes),
			brandingMK04.kind,
			brandingMK04.paramsDefault201(adminParams.token),
		)

		arquivoAntigo = `${primeira.json.key}`.split("/").pop() as string

		await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK04.casePrefix)
				.withLogoKey(primeira.json.key)
				.build(),
			brandingMK04.paramsDefault200(adminParams.token),
		)

		// A antiga precisa estar servível ANTES da substituição, senão o 404 do
		// teste não prova nada — poderia ser upload que nunca chegou ao bucket.
		await getBrandingAsset(
			tenantId,
			brandingMK04.kind,
			arquivoAntigo,
			brandingMK04.paramsDefault200(adminParams.token),
		)
	})

	it("[MK-04-F] - Substituir a logo apaga o objeto anterior do armazenamento", async () => {
		const segunda = await postUploadBranding(
			writeJpeg("marca-logo-nova.jpg", brandingMK04.segundaLogoBytes),
			brandingMK04.kind,
			brandingMK04.paramsDefault201(adminParams.token),
		)

		const salva = await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK04.casePrefix)
				.withLogoKey(segunda.json.key)
				.build(),
			brandingMK04.paramsDefault200(adminParams.token),
		)

		assertTs.exists(
			salva.json.logoUrl,
			"A marca ficou sem logo depois da substituição.",
		)

		await getBrandingAsset(
			tenantId,
			brandingMK04.kind,
			arquivoAntigo,
			brandingMK04.paramsDefault404(adminParams.token),
		)

		assertTs.isFalse(
			`${salva.json.logoUrl}`.includes(arquivoAntigo),
			"A marca continua apontando para o arquivo antigo depois da substituição.",
		)
	})
})
