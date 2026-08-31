import {
	assertTs,
	authBusiness,
	catalogBusiness,
	categoryBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateCategory from "@core/services/catalog/postCreateCategory.service"
import { catalogCAT02 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT02.loginParams,
		)
	})

	it("[CAT-02-F] - Nome, descrição e ícone fora do padrão são recusados; sem ícone, assume o padrão", async () => {
		const base = categoryBuilder.withName(catalogCAT02.casePrefix).build()

		const mensagens = await catalogBusiness.rejectedCategories(
			[
				{ ...base, name: catalogCAT02.longName },
				{ ...base, description: catalogCAT02.longDescription },
				...catalogCAT02.invalidIcons.map((icon) => ({ ...base, icon })),
			],
			catalogCAT02.paramsDefault400(adminParams.token),
		)

		const esperadas = [
			catalogCAT02.messages.name,
			catalogCAT02.messages.description,
			catalogCAT02.messages.icon,
			catalogCAT02.messages.icon,
			catalogCAT02.messages.icon,
		]

		const semAMensagem = esperadas.filter(
			(esperada, indice) => !mensagens[indice].includes(esperada),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Alguma variação inválida da categoria não trouxe a mensagem do seu campo.",
		)

		const semIcone = await postCreateCategory(
			categoryBuilder.withName(catalogCAT02.casePrefix).build(),
			catalogCAT02.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			semIcone.json.icon,
			catalogCAT02.defaultIcon,
			"A categoria sem ícone não assumiu o ícone padrão.",
		)
	})
})
