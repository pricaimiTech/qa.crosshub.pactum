import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateProduct from "@core/services/catalog/postCreateProduct.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { catalogCAT16 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let secondTenantParams: IParamsDefault

	before("Produto já criado com o nome do caso", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT16.loginParams,
		)

		await catalogBusiness.createProduct(
			productBuilder.withExactName(catalogCAT16.sharedName).build(),
			adminParams,
		)

		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			catalogCAT16.loginParams,
		)
	})

	it(`[CAT-16-F] - Nome de produto é único no tenant, mas livre em outro tenant`, async () => {
		const { json } = await postCreateProduct(
			productBuilder.withExactName(catalogCAT16.sharedName).build(),
			catalogCAT16.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.message,
			catalogCAT16.duplicateMessage,
			"A colisão de nome de produto não trouxe a mensagem de negócio.",
		)

		const outroTenant = await postCreateProduct(
			productBuilder.withExactName(catalogCAT16.sharedName).build(),
			catalogCAT16.paramsDefault201(secondTenantParams.token),
		)

		assertTs.exists(
			outroTenant.json.id,
			"O nome já usado no tenant A foi recusado no tenant B — a unicidade deveria ser por tenant.",
		)
	})
})
