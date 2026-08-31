import {
	assertTs,
	authBusiness,
	bannerBuilder,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { writeJpeg } from "@core/utils/file.utils"
import { bannersBN05 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let imageKey: string

	before("Imagem enviada, pronta para vincular", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bannersBN05.loginParams,
		)

		imageKey = await bannersBusiness.uploadImage(
			writeJpeg("banner-texto.jpg", bannersBN05.imageBytes),
			adminParams,
		)
	})

	it("[BN-05-F] - Texto do botão acima do limite e título ausente são recusados", async () => {
		const comRotuloLongo = bannerBuilder
			.withTitle(bannersBN05.casePrefix)
			.withImageKey(imageKey)
			.withAction(bannersBN05.validLink, bannersBN05.longLabel)
			.withIsActive(false)
			.build()

		const semTitulo = bannerBuilder
			.withTitle(bannersBN05.casePrefix)
			.withImageKey(imageKey)
			.withIsActive(false)
			.build()

		semTitulo.title = ""

		const mensagens = await bannersBusiness.rejectedBanners(
			[comRotuloLongo, semTitulo],
			bannersBN05.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			mensagens[0],
			bannersBN05.labelMessage,
			"O texto de botão acima do limite não trouxe a mensagem especificada.",
		)

		assertTs.include(
			mensagens[1],
			bannersBN05.titleMessage,
			"O banner sem título não trouxe a mensagem especificada.",
		)
	})
})
