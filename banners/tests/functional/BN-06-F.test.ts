import {
	assertTs,
	authBusiness,
	bannerBuilder,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { writeJpeg } from "@core/utils/file.utils"
import { tenantFor } from "@core/utils/tenant.utils"
import { bannersBN06 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let bannerIds: Array<string>
	let ordemOriginal: Array<string>

	before("Quatro banners no tenant do caso", async () => {
		const tenant = tenantFor(bannersBN06.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			bannersBN06.loginParams,
		)

		await bannersBusiness.cleanupBanners(adminParams)

		const imageKey = await bannersBusiness.uploadImage(
			writeJpeg("banner-ordem.jpg", bannersBN06.imageBytes),
			adminParams,
		)

		bannerIds = await bannersBusiness.createBanners(
			Array.from({ length: bannersBN06.bannerCount }, () =>
				bannerBuilder
					.withTitle(bannersBN06.casePrefix)
					.withImageKey(imageKey)
					.withIsActive(false)
					.build(),
			),
			adminParams,
		)

		const banners = await bannersBusiness.banners(
			bannersBN06.paramsDefault200(adminParams.token),
		)

		ordemOriginal = banners.map((banner) => banner.id)
	})

	it("[BN-06-F] - Reordenação incompleta, com id desconhecido ou repetido é recusada sem aplicar nada", async () => {
		const mensagens = await bannersBusiness.rejectedReorders(
			[
				bannerIds.slice(0, bannersBN06.bannerCount - 1),
				[...bannerIds.slice(0, bannersBN06.bannerCount - 1), bannersBN06.unknownId],
				[...bannerIds.slice(0, bannersBN06.bannerCount - 1), bannerIds[0]],
			],
			bannersBN06.paramsDefault400(adminParams.token),
		)

		const semAMensagem = mensagens.filter(
			(mensagem) => !mensagem.includes(bannersBN06.errorMessage),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Alguma reordenação inválida não trouxe a mensagem especificada.",
		)

		const depois = await bannersBusiness.banners(
			bannersBN06.paramsDefault200(adminParams.token),
		)

		assertTs.deepEqual(
			depois.map((banner) => banner.id),
			ordemOriginal,
			"A ordem mudou apesar de todas as reordenações terem sido recusadas.",
		)
	})
})
