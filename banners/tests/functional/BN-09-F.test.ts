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
import { bannersBN09 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let bannerId: string
	let primeiraUrl: string
	let segundaKey: string

	before("Banner com a primeira imagem vinculada", async () => {
		const tenant = tenantFor(bannersBN09.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			bannersBN09.loginParams,
		)

		await bannersBusiness.cleanupBanners(adminParams)

		const primeiraKey = await bannersBusiness.uploadImage(
			writeJpeg("banner-primeira.jpg", bannersBN09.imageBytes),
			adminParams,
		)

		segundaKey = await bannersBusiness.uploadImage(
			writeJpeg("banner-segunda.jpg", bannersBN09.imageBytes),
			adminParams,
		)

		const ids = await bannersBusiness.createBanners(
			[
				bannerBuilder
					.withTitle(bannersBN09.casePrefix)
					.withImageKey(primeiraKey)
					.build(),
			],
			adminParams,
		)

		bannerId = ids[0]

		const banners = await bannersBusiness.banners(
			bannersBN09.paramsDefault200(adminParams.token),
		)

		primeiraUrl = banners.filter((banner) => banner.id === bannerId)[0].imageUrl
	})

	it("[BN-09-F] - Substituir a imagem do banner deixa a anterior no armazenamento", async () => {
		await patchUpdateBanner(
			bannerId,
			{ imageKey: segundaKey },
			bannersBN09.paramsDefault200(adminParams.token),
		)

		const anterior = await fetch(primeiraUrl)

		// Comportamento conhecido e divergente de Marca, onde o ativo anterior é
		// removido. O caso registra a diferença entre os dois módulos.
		assertTs.equal(
			anterior.status,
			200,
			"A imagem anterior foi removida do armazenamento — o comportamento mudou e passou a divergir do que está registrado.",
		)
	})
})
