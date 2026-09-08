import {
	addonsBusiness,
	assertTs,
	authBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getAppointmentsAnalytics from "@core/services/analytics/getAppointmentsAnalytics.service"
import { analyticsANL04 } from "@analytics-data/analytics.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Tenant principal com o add-on ativo", async () => {
		// Garantir o add-on ativo é idempotente e é o estado final esperado do
		// tenant principal — outros casos do módulo dependem dele.
		const platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			analyticsANL04.loginParams,
		)
		const tenantId = await addonsBusiness.tenantIdBySlug(
			`${process.env.TENANT_SLUG}`,
			platformParams,
		)

		await addonsBusiness.setAddOnStatus(
			tenantId,
			analyticsANL04.addOnCode,
			"active",
			platformParams,
		)

		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			analyticsANL04.loginParams,
		)
	})

	it("[ANL-04-F] - Período acima de 12 meses é recusado com 400", async () => {
		const { json } = await getAppointmentsAnalytics(
			analyticsANL04.period,
			analyticsANL04.paramsDefault400(adminParams.token),
		)

		assertTs.equal(
			json.message,
			analyticsANL04.errorMessage,
			"Mensagem de erro diferente da esperada para o período longo.",
		)
		assertTs.equal(
			json.statusCode,
			400,
			"Status code do corpo de erro divergente.",
		)
	})
})
