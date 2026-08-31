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
import { bannersBN04 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let imageKey: string

	before("Imagem enviada, pronta para vincular", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bannersBN04.loginParams,
		)

		imageKey = await bannersBusiness.uploadImage(
			writeJpeg("banner-link.jpg", bannersBN04.imageBytes),
			adminParams,
		)
	})

	it("[BN-04-F] - Link fora do padrão http(s) é recusado; https é aceito", async () => {
		const mensagens = await bannersBusiness.rejectedBanners(
			bannersBN04.invalidLinks.map((link) =>
				bannerBuilder
					.withTitle(bannersBN04.casePrefix)
					.withImageKey(imageKey)
					.withAction(link)
					.withIsActive(false)
					.build(),
			),
			bannersBN04.paramsDefault400(adminParams.token),
		)

		const semAMensagem = mensagens.filter(
			(mensagem) => !mensagem.includes(bannersBN04.errorMessage),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Algum link inválido não foi recusado com a mensagem especificada.",
		)

		const { json } = await postCreateBanner(
			bannerBuilder
				.withTitle(bannersBN04.casePrefix)
				.withImageKey(imageKey)
				.withAction(bannersBN04.validLink)
				.withIsActive(false)
				.build(),
			bannersBN04.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			json.actionLink,
			bannersBN04.validLink,
			"O link https não foi gravado como enviado.",
		)
	})
})
