import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getPublicProducts from "@core/services/public/getPublicProducts.service"
import patchUpdateProduct from "@core/services/catalog/patchUpdateProduct.service"
import postPublicReserveProduct from "@core/services/public/postPublicReserveProduct.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { catalogCAT07 } from "@catalog-data/catalog.data"

describe(describeName.public, () => {
	let adminParams: IParamsDefault
	let clientParams: IParamsDefault
	let productId: string

	before("Produto criado e depois inativado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT07.loginParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCAT07.casePrefix).build(),
			adminParams,
		)

		productId = produto.id

		await patchUpdateProduct(
			productId,
			{ isActive: false },
			catalogCAT07.paramsDefault200(adminParams.token),
		)

		const client = endUsersFor(catalogCAT07.caseId)[0]

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			client.email,
			client.password,
			catalogCAT07.loginParams,
		)
	})

	it("[CAT-07-F] - Produto inativo some da vitrine e recusa reserva", async () => {
		const vitrine = await getPublicProducts(
			`${process.env.TENANT_SLUG}`,
			catalogCAT07.paramsDefault200(clientParams.token),
		)

		assertTs.notInclude(
			JSON.stringify(vitrine.json),
			productId,
			"O produto inativo continua aparecendo na vitrine pública.",
		)

		const { json } = await postPublicReserveProduct(
			productId,
			{ note: catalogCAT07.note },
			catalogCAT07.paramsDefault404(clientParams.token),
		)

		assertTs.equal(
			json.message,
			catalogCAT07.errorMessage,
			"A reserva de produto inativo não trouxe a mensagem especificada.",
		)
	})
})
