import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	catalogBusiness,
	categoryBuilder,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateProduct from "@core/services/catalog/postCreateProduct.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { catalogCAT05 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let foreignCategoryId: string

	before("Categoria criada no tenant B", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			catalogCAT05.loginParams,
		)

		foreignCategoryId = await catalogBusiness.createCategory(
			categoryBuilder.withName(catalogCAT05.casePrefix).build(),
			secondTenantParams,
		)

		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT05.loginParams,
		)
	})

	it("[CAT-05-F] - Categoria de outro tenant não é encontrada, e o produto não é criado", async () => {
		const { json } = await postCreateProduct(
			productBuilder
				.withName(catalogCAT05.casePrefix)
				.withCategory(foreignCategoryId)
				.build(),
			catalogCAT05.paramsDefault404(adminParams.token),
		)

		assertTs.equal(
			json.message,
			catalogCAT05.errorMessage,
			"O vínculo com categoria de outro tenant não trouxe a mensagem especificada.",
		)
	})
})
