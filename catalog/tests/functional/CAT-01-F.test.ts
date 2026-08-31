import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	catalogBusiness,
	categoryBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateCategory from "@core/services/catalog/postCreateCategory.service"
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { secondTenantFile } from "@shared-data/tenants.data"
import { catalogCAT01 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let secondTenantParams: IParamsDefault

	before("Categoria já criada com o nome do caso", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT01.loginParams,
		)

		await catalogBusiness.createCategory(
			categoryBuilder.withExactName(catalogCAT01.sharedName).build(),
			adminParams,
		)

		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			catalogCAT01.loginParams,
		)
	})

	it(`[CAT-01-F]${bugTag(catalogCAT01.knownBug)} - Nome de categoria é único no tenant, mas livre em outro tenant`, async () => {
		const { json } = await postCreateCategory(
			categoryBuilder.withExactName(catalogCAT01.sharedName).build(),
			catalogCAT01.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.statusCode,
			409,
			bugMessage(
				"A colisão de nome de categoria não foi recusada com 409.",
				catalogCAT01.knownBug,
			),
		)

		const outroTenant = await postCreateCategory(
			categoryBuilder.withExactName(catalogCAT01.sharedName).build(),
			catalogCAT01.paramsDefault201(secondTenantParams.token),
		)

		assertTs.exists(
			outroTenant.json.id,
			"O nome já usado no tenant A foi recusado no tenant B — a unicidade deveria ser por tenant.",
		)
	})
})
