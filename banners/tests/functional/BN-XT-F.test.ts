import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	bannerBuilder,
	bannersBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import deleteBanner from "@core/services/banners/deleteBanner.service"
import patchReorderBanners from "@core/services/banners/patchReorderBanners.service"
import patchUpdateBanner from "@core/services/banners/patchUpdateBanner.service"
import { writeJpeg } from "@core/utils/file.utils"
import { secondTenantFile } from "@shared-data/tenants.data"
import { bannersBNXT } from "@banners-data/banners.data"

describe(describeName.dashboard, () => {
	let firstTenantParams: IParamsDefault
	let foreignBannerId: string

	before("Banner criado no tenant B", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			bannersBNXT.loginParams,
		)

		const imageKey = await bannersBusiness.uploadImage(
			writeJpeg("banner-tenant-b.jpg", bannersBNXT.imageBytes),
			secondTenantParams,
		)

		const ids = await bannersBusiness.createBanners(
			[
				bannerBuilder
					.withTitle(bannersBNXT.casePrefix)
					.withImageKey(imageKey)
					.withIsActive(false)
					.build(),
			],
			secondTenantParams,
		)

		foreignBannerId = ids[0]

		firstTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bannersBNXT.loginParams,
		)
	})

	it("[BN-XT-F] - Tenant A não lista, edita, exclui nem reordena o banner do tenant B", async () => {
		const banners = await bannersBusiness.banners(
			bannersBNXT.paramsDefault200(firstTenantParams.token),
		)

		const vazado = banners.filter((banner) => banner.id === foreignBannerId)

		assertTs.lengthOf(
			vazado,
			0,
			"Um banner do tenant B apareceu na listagem do tenant A.",
		)

		await patchUpdateBanner(
			foreignBannerId,
			{ title: bannersBNXT.editedTitle },
			bannersBNXT.paramsDefault404(firstTenantParams.token),
		)

		await deleteBanner(
			foreignBannerId,
			bannersBNXT.paramsDefault404(firstTenantParams.token),
		)

		// A reordenação exige a lista exata do próprio tenant: um id de fora nunca
		// entra, nem misturado aos próprios.
		await patchReorderBanners(
			{ ids: [...banners.map((banner) => banner.id), foreignBannerId] },
			bannersBNXT.paramsDefault400(firstTenantParams.token),
		)
	})
})
