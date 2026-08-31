import {
	assertTs,
	authBusiness,
	brandingBuilder,
	brandingBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { brandingMK03 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant reservado ao caso", async () => {
		const tenant = tenantFor(brandingMK03.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK03.loginParams,
		)
	})

	it("[MK-03-F] - Cor fora do formato #RRGGBB é recusada; minúscula é aceita e normalizada", async () => {
		const mensagens = await brandingBusiness.rejectedBrandings(
			brandingMK03.invalidColors.map((cor) => ({
				...brandingBuilder.withDisplayName(brandingMK03.casePrefix).build(),
				accentColor: cor,
			})),
			brandingMK03.paramsDefault400(adminParams.token),
		)

		const semAMensagem = mensagens.filter(
			(mensagem) => !mensagem.includes(brandingMK03.errorMessage),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Alguma cor fora do formato não foi recusada com a mensagem especificada.",
		)

		const { json } = await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK03.casePrefix)
				.withAccentColor(brandingMK03.lowercaseColor)
				.build(),
			brandingMK03.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.accentColor,
			brandingMK03.normalizedColor,
			"A cor em minúsculas não foi normalizada para maiúsculas.",
		)
	})
})
