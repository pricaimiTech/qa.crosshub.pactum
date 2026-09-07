import {
	assertTs,
	authBusiness,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchBannerSettings from "@core/services/banners/patchBannerSettings.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { bannersBN08 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant reservado ao caso", async () => {
		const tenant = tenantFor(bannersBN08.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			bannersBN08.loginParams,
		)
	})

	it(`[BN-08-F] - Intervalo fora do enum e altura desconhecida são recusados; combinação válida é gravada`, async () => {
		const mensagens = await bannersBusiness.rejectedCarouselSettings(
			bannersBN08.invalidSettings,
			bannersBN08.paramsDefault400(adminParams.token),
		)

		const semAMensagem = mensagens.filter(
			(mensagem) => !mensagem.includes(bannersBN08.errorMessage),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Alguma configuração inválida do carrossel não trouxe a mensagem especificada.",
		)

		await patchBannerSettings(
			bannersBN08.validSettings,
			bannersBN08.paramsDefault200(adminParams.token),
		)

		const settings = await bannersBusiness.carouselSettings(
			bannersBN08.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			settings.interval,
			bannersBN08.validSettings.interval,
			"O intervalo válido não foi gravado.",
		)

		assertTs.equal(
			settings.height,
			bannersBN08.validSettings.height,
			"A altura válida não foi gravada.",
		)
	})
})
