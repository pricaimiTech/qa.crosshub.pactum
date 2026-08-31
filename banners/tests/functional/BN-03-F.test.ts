import {
	assertTs,
	authBusiness,
	bannerBuilder,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { bannersBN03 } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bannersBN03.loginParams,
		)
	})

	it("[BN-03-F] - Banner sem imagem é recusado", async () => {
		const mensagens = await bannersBusiness.rejectedBanners(
			[bannerBuilder.withTitle(bannersBN03.casePrefix).build()],
			bannersBN03.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			mensagens[0],
			bannersBN03.errorMessage,
			"A criação sem imagem não trouxe a mensagem especificada.",
		)
	})
})
