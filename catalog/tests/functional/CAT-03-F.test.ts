import {
	assertTs,
	authBusiness,
	catalogBusiness,
	categoryBuilder,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchUpdateProduct from "@core/services/catalog/patchUpdateProduct.service"
import postCreateProduct from "@core/services/catalog/postCreateProduct.service"
import { catalogCAT03 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let inactiveCategoryId: string
	let productId: string

	before("Uma categoria inativa e um produto sem categoria", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT03.loginParams,
		)

		inactiveCategoryId = await catalogBusiness.createCategory(
			categoryBuilder
				.withName(catalogCAT03.casePrefix)
				.withIsActive(false)
				.build(),
			adminParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCAT03.casePrefix).build(),
			adminParams,
		)

		productId = produto.id
	})

	it("[CAT-03-F] - Categoria inativa é recusada tanto na criação quanto na edição do produto", async () => {
		const criacao = await postCreateProduct(
			productBuilder
				.withName(catalogCAT03.casePrefix)
				.withCategory(inactiveCategoryId)
				.build(),
			catalogCAT03.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			criacao.json.message,
			catalogCAT03.errorMessage,
			"A criação com categoria inativa não trouxe a mensagem especificada.",
		)

		const edicao = await patchUpdateProduct(
			productId,
			{ categoryId: inactiveCategoryId },
			catalogCAT03.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			edicao.json.message,
			catalogCAT03.errorMessage,
			"A edição para categoria inativa não trouxe a mensagem especificada.",
		)
	})
})
