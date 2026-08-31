import {
	assertTs,
	authBusiness,
	bannerBuilder,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchUpdateBanner from "@core/services/banners/patchUpdateBanner.service"
import { writeJpeg } from "@core/utils/file.utils"
import { tenantFor } from "@core/utils/tenant.utils"
import { bannersBN02 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let activeIds: Array<string>
	let inactiveId: string

	before("Três banners ativos e um inativo", async () => {
		const tenant = tenantFor(bannersBN02.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			bannersBN02.loginParams,
		)

		await bannersBusiness.cleanupBanners(adminParams)

		const imageKey = await bannersBusiness.uploadImage(
			writeJpeg("banner.jpg", bannersBN02.imageBytes),
			adminParams,
		)

		activeIds = await bannersBusiness.createBanners(
			Array.from({ length: bannersBN02.activeLimit }, () =>
				bannerBuilder
					.withTitle(bannersBN02.casePrefix)
					.withImageKey(imageKey)
					.build(),
			),
			adminParams,
		)

		const inativos = await bannersBusiness.createBanners(
			[
				bannerBuilder
					.withTitle(bannersBN02.casePrefix)
					.withImageKey(imageKey)
					.withIsActive(false)
					.build(),
			],
			adminParams,
		)

		inactiveId = inativos[0]
	})

	it("[BN-02-F] - Ativar um quarto banner é recusado; liberando uma vaga, é aceito", async () => {
		const { json } = await patchUpdateBanner(
			inactiveId,
			{ isActive: true },
			bannersBN02.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(json.message),
			bannersBN02.errorMessage,
			"A ativação com o limite cheio não trouxe a mensagem especificada.",
		)

		await patchUpdateBanner(
			activeIds[0],
			{ isActive: false },
			bannersBN02.paramsDefault200(adminParams.token),
		)

		const liberado = await patchUpdateBanner(
			inactiveId,
			{ isActive: true },
			bannersBN02.paramsDefault200(adminParams.token),
		)

		assertTs.isTrue(
			liberado.json.isActive,
			"Com uma vaga liberada, a ativação continuou sendo recusada.",
		)
	})
})
