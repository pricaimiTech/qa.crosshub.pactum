import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import deleteProduct from "@core/services/catalog/deleteProduct.service"
import postUpload from "@core/services/catalog/postUpload.service"
import { writeJpeg } from "@core/utils/file.utils"
import { catalogCAT09 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let productId: string
	let publicUrl: string

	before("Produto com imagem enviada", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT09.loginParams,
		)

		const imagem = await postUpload(
			writeJpeg("produto-para-excluir.jpg", catalogCAT09.imageBytes),
			catalogCAT09.paramsDefault201(adminParams.token),
		)

		publicUrl = imagem.json.publicUrl

		const produto = await catalogBusiness.createProduct(
			productBuilder
				.withName(catalogCAT09.casePrefix)
				.withImageKey(imagem.json.key)
				.build(),
			adminParams,
		)

		productId = produto.id
	})

	it("[CAT-09-F] - Excluir o produto apaga também a imagem do armazenamento", async () => {
		const antes = await fetch(publicUrl)

		assertTs.equal(
			antes.status,
			200,
			"A imagem não estava acessível antes da exclusão — o caso não prova nada assim.",
		)

		await deleteProduct(
			productId,
			catalogCAT09.paramsDefault200(adminParams.token),
		)

		const depois = await fetch(publicUrl)

		assertTs.equal(
			depois.status,
			404,
			"A imagem continua acessível depois de o produto ser excluído — o objeto ficou órfão no armazenamento.",
		)
	})
})
