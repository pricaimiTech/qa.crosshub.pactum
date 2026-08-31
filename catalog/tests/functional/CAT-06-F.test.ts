import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateProduct from "@core/services/catalog/postCreateProduct.service"
import { catalogCAT06 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT06.loginParams,
		)
	})

	it("[CAT-06-F] - Preço negativo ou fracionário é recusado; inteiro é aceito e a ausência vira null", async () => {
		const mensagens = await catalogBusiness.rejectedProducts(
			catalogCAT06.invalidPrices.map((preco) =>
				productBuilder
					.withName(catalogCAT06.casePrefix)
					.withPriceCents(preco)
					.build(),
			),
			catalogCAT06.paramsDefault400(adminParams.token),
		)

		const semAMensagem = mensagens.filter(
			(mensagem) => !mensagem.includes(catalogCAT06.errorMessage),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Algum preço inválido não foi recusado com a mensagem especificada.",
		)

		const comPreco = await postCreateProduct(
			productBuilder
				.withName(catalogCAT06.casePrefix)
				.withPriceCents(catalogCAT06.validPrice)
				.build(),
			catalogCAT06.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			comPreco.json.priceCents,
			catalogCAT06.validPrice,
			"O preço inteiro não foi gravado como enviado.",
		)

		const semPreco = await postCreateProduct(
			productBuilder.withName(catalogCAT06.casePrefix).build(),
			catalogCAT06.paramsDefault201(adminParams.token),
		)

		assertTs.isNull(
			semPreco.json.priceCents,
			"O produto sem preço não ficou com priceCents null.",
		)
	})
})
