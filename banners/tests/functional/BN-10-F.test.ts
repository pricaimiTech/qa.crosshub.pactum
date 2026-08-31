import {
	assertTs,
	authBusiness,
	bannerBuilder,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getPublicTenant from "@core/services/public/getPublicTenant.service"
import { writeJpeg } from "@core/utils/file.utils"
import { tenantFor } from "@core/utils/tenant.utils"
import { bannersBN10 } from "@banners-data/banners.data"

describe(describeName.public, () => {
	let tenantSlug: string
	let activeIds: Array<string>
	let inactiveId: string

	before("Dois banners ativos e um inativo, em ordem conhecida", async () => {
		const tenant = tenantFor(bannersBN10.caseId)

		tenantSlug = tenant.slug

		const adminParams: IParamsDefault =
			await authBusiness.loginAsTenantAdmin(
				tenant.slug,
				tenant.adminEmail,
				tenant.adminPassword,
				bannersBN10.loginParams,
			)

		await bannersBusiness.cleanupBanners(adminParams)

		const imageKey = await bannersBusiness.uploadImage(
			writeJpeg("banner-publico.jpg", bannersBN10.imageBytes),
			adminParams,
		)

		activeIds = await bannersBusiness.createBanners(
			Array.from({ length: bannersBN10.activeCount }, () =>
				bannerBuilder
					.withTitle(bannersBN10.casePrefix)
					.withImageKey(imageKey)
					.build(),
			),
			adminParams,
		)

		const inativos = await bannersBusiness.createBanners(
			[
				bannerBuilder
					.withTitle(bannersBN10.casePrefix)
					.withImageKey(imageKey)
					.withIsActive(false)
					.build(),
			],
			adminParams,
		)

		inactiveId = inativos[0]
	})

	it("[BN-10-F] - O app recebe só os banners ativos, na ordem definida", async () => {
		const { json } = await getPublicTenant(
			tenantSlug,
			bannersBN10.paramsDefault200(),
		)

		const ids = json.banners.map((banner: { id: string }) => banner.id)

		assertTs.deepEqual(
			ids,
			activeIds,
			"O app não recebeu exatamente os banners ativos, na ordem definida.",
		)

		assertTs.notInclude(
			ids,
			inactiveId,
			"Um banner inativo chegou ao app.",
		)
	})
})
