import {
	assertTs,
	authBusiness,
	bannerBuilder,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateBanner from "@core/services/banners/postCreateBanner.service"
import { writeJpeg } from "@core/utils/file.utils"
import { tenantFor } from "@core/utils/tenant.utils"
import { bannersBN01 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let imageKey: string

	before("Três banners ativos no tenant do caso", async () => {
		// O limite de ativos é do tenant inteiro, então cada caso usa o seu.
		const tenant = tenantFor(bannersBN01.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			bannersBN01.loginParams,
		)

		await bannersBusiness.cleanupBanners(adminParams)

		imageKey = await bannersBusiness.uploadImage(
			writeJpeg("banner.jpg", bannersBN01.imageBytes),
			adminParams,
		)

		await bannersBusiness.createBanners(
			Array.from({ length: bannersBN01.activeLimit }, () =>
				bannerBuilder
					.withTitle(bannersBN01.casePrefix)
					.withImageKey(imageKey)
					.build(),
			),
			adminParams,
		)
	})

	it("[BN-01-F] - O quarto banner ativo é recusado; criado inativo, é aceito", async () => {
		const { json } = await postCreateBanner(
			bannerBuilder
				.withTitle(bannersBN01.casePrefix)
				.withImageKey(imageKey)
				.build(),
			bannersBN01.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(json.message),
			bannersBN01.errorMessage,
			"O quarto banner ativo não foi recusado com a mensagem especificada.",
		)

		const inativo = await postCreateBanner(
			bannerBuilder
				.withTitle(bannersBN01.casePrefix)
				.withImageKey(imageKey)
				.withIsActive(false)
				.build(),
			bannersBN01.paramsDefault201(adminParams.token),
		)

		assertTs.exists(
			inativo.json.id,
			"O banner inativo foi recusado, mas ele não ocupa vaga no carrossel.",
		)
	})
})
