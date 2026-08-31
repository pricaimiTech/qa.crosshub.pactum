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
import getProducts from "@core/services/catalog/getProducts.service"
import getPublicProducts from "@core/services/public/getPublicProducts.service"
import patchUpdateProduct from "@core/services/catalog/patchUpdateProduct.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { catalogCATXT } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let firstTenantParams: IParamsDefault
	let foreignProductId: string
	let secondTenantSlug: string

	before("Produto criado no tenant B", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		secondTenantSlug = secondTenant.slug

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			catalogCATXT.loginParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCATXT.casePrefix).build(),
			secondTenantParams,
		)

		foreignProductId = produto.id

		firstTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCATXT.loginParams,
		)
	})

	it("[CAT-XT-F] - Tenant A não vê nem edita o produto do B, e a vitrine pública responde pelo slug pedido", async () => {
		const { json } = await getProducts(
			catalogCATXT.paramsDefault200(firstTenantParams.token),
		)

		const vazado = json.filter(
			(produto: { id: string }) => produto.id === foreignProductId,
		)

		assertTs.lengthOf(
			vazado,
			0,
			"Um produto do tenant B apareceu na listagem do tenant A.",
		)

		await patchUpdateProduct(
			foreignProductId,
			{ name: catalogCATXT.editedName },
			catalogCATXT.paramsDefault404(firstTenantParams.token),
		)

		// A vitrine pública responde pelo slug do caminho, não pelo token.
		const vitrineDoB = await getPublicProducts(
			secondTenantSlug,
			catalogCATXT.paramsDefault200(firstTenantParams.token),
		)

		assertTs.include(
			JSON.stringify(vitrineDoB.json),
			foreignProductId,
			"A vitrine pública do tenant B não trouxe o produto do próprio B.",
		)
	})
})
