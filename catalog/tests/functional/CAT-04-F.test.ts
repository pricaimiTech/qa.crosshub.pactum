import {
	assertTs,
	authBusiness,
	catalogBusiness,
	categoryBuilder,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import deleteCategory from "@core/services/catalog/deleteCategory.service"
import getProducts from "@core/services/catalog/getProducts.service"
import { catalogCAT04 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let categoryId: string
	let productIds: Array<string>

	before("Categoria com três produtos vinculados", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT04.loginParams,
		)

		categoryId = await catalogBusiness.createCategory(
			categoryBuilder.withName(catalogCAT04.casePrefix).build(),
			adminParams,
		)

		productIds = await catalogBusiness.createProducts(
			Array.from({ length: catalogCAT04.productCount }, () =>
				productBuilder
					.withName(catalogCAT04.casePrefix)
					.withCategory(categoryId)
					.build(),
			),
			adminParams,
		)
	})

	it("[CAT-04-F] - Excluir a categoria desvincula os produtos, sem apagar nenhum", async () => {
		await deleteCategory(
			categoryId,
			catalogCAT04.paramsDefault200(adminParams.token),
		)

		const { json } = await getProducts(
			catalogCAT04.paramsDefault200(adminParams.token),
		)

		const doCaso = json.filter((produto: { id: string }) =>
			productIds.includes(produto.id),
		)

		assertTs.lengthOf(
			doCaso,
			catalogCAT04.productCount,
			"Algum produto foi apagado junto com a categoria.",
		)

		const aindaVinculados = doCaso.filter(
			(produto: { categoryId: string | null }) => produto.categoryId !== null,
		)

		assertTs.deepEqual(
			aindaVinculados,
			[],
			"Algum produto continuou apontando para a categoria excluída.",
		)
	})
})
