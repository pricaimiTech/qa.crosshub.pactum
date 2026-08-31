import {
	assertTs,
	authBusiness,
	bannerBuilder,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchReorderBanners from "@core/services/banners/patchReorderBanners.service"
import { writeJpeg } from "@core/utils/file.utils"
import { tenantFor } from "@core/utils/tenant.utils"
import { bannersBN07 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let novaOrdem: Array<string>

	before("Três banners no tenant do caso", async () => {
		const tenant = tenantFor(bannersBN07.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			bannersBN07.loginParams,
		)

		await bannersBusiness.cleanupBanners(adminParams)

		const imageKey = await bannersBusiness.uploadImage(
			writeJpeg("banner-nova-ordem.jpg", bannersBN07.imageBytes),
			adminParams,
		)

		await bannersBusiness.createBanners(
			Array.from({ length: bannersBN07.bannerCount }, () =>
				bannerBuilder
					.withTitle(bannersBN07.casePrefix)
					.withImageKey(imageKey)
					.build(),
			),
			adminParams,
		)

		const banners = await bannersBusiness.banners(
			bannersBN07.paramsDefault200(adminParams.token),
		)

		// Ordem invertida: qualquer permutação serve, contanto que seja completa.
		novaOrdem = banners.map((banner) => banner.id).reverse()
	})

	it("[BN-07-F] - A reordenação completa é aplicada e reflete em position", async () => {
		await patchReorderBanners(
			{ ids: novaOrdem },
			bannersBN07.paramsDefault200(adminParams.token),
		)

		const banners = await bannersBusiness.banners(
			bannersBN07.paramsDefault200(adminParams.token),
		)

		assertTs.deepEqual(
			banners.map((banner) => banner.id),
			novaOrdem,
			"A listagem não reflete a nova ordem pedida.",
		)

		assertTs.deepEqual(
			banners.map((banner) => banner.position),
			banners.map((_banner, indice) => indice),
			"As posições não foram renumeradas em sequência a partir de zero.",
		)
	})
})
