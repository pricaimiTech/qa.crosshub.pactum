import {
	assertTs,
	authBusiness,
	brandingBuilder,
	brandingBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { tenantFor } from "@core/utils/tenant.utils"
import { brandingMK02 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant reservado ao caso", async () => {
		const tenant = tenantFor(brandingMK02.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK02.loginParams,
		)
	})

	it("[MK-02-F] - Nome, cor e tema são obrigatórios no upsert da marca", async () => {
		const base = brandingBuilder
			.withDisplayName(brandingMK02.casePrefix)
			.build()

		const semNome = { ...base } as Record<string, unknown>
		const semCor = { ...base } as Record<string, unknown>
		const semTema = { ...base } as Record<string, unknown>

		delete semNome.displayName
		delete semCor.accentColor
		delete semTema.themeMode

		const mensagens = await brandingBusiness.rejectedBrandings(
			[semNome, semCor, semTema],
			brandingMK02.paramsDefault400(adminParams.token),
		)

		const esperadas = [
			brandingMK02.nameMessage,
			brandingMK02.colorMessage,
			brandingMK02.themeMessage,
		]

		const semAMensagem = esperadas.filter(
			(esperada, indice) => !mensagens[indice].includes(esperada),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Algum campo obrigatório ausente não trouxe a mensagem especificada.",
		)
	})
})
