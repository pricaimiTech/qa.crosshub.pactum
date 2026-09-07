import {
	addonsBusiness,
	assertTs,
	authBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getAppointmentsAnalytics from "@core/services/analytics/getAppointmentsAnalytics.service"
import getAppointmentsAnalyticsExport from "@core/services/analytics/getAppointmentsAnalyticsExport.service"
import getCustomersAnalytics from "@core/services/analytics/getCustomersAnalytics.service"
import getCustomersAnalyticsExport from "@core/services/analytics/getCustomersAnalyticsExport.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { analyticsANL03 } from "@analytics-data/analytics.data"

describe(describeName.dashboard, () => {
	const tenant = tenantFor(analyticsANL03.caseId)
	let adminParams: IParamsDefault

	before("Tenant reservado ao caso, sem o add-on", async () => {
		const platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			analyticsANL03.loginParams,
		)

		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL03.addOnCode,
			"inactive",
			platformParams,
		)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			analyticsANL03.loginParams,
		)
	})

	it("[ANL-03-F] - Sem o add-on, as quatro rotas do Analytics respondem 403 com a mensagem do gate", async () => {
		const appointments = await getAppointmentsAnalytics(
			analyticsANL03.period,
			analyticsANL03.paramsDefault403(adminParams.token),
		)
		const appointmentsCsv = await getAppointmentsAnalyticsExport(
			analyticsANL03.period,
			analyticsANL03.paramsDefault403(adminParams.token),
		)
		const customers = await getCustomersAnalytics(
			analyticsANL03.period,
			analyticsANL03.paramsDefault403(adminParams.token),
		)
		const customersCsv = await getCustomersAnalyticsExport(
			analyticsANL03.period,
			analyticsANL03.paramsDefault403(adminParams.token),
		)

		assertTs.equal(
			appointments.json.message,
			analyticsANL03.errorMessage,
			"A aba Agendamentos não recusou com a mensagem do gate.",
		)
		assertTs.equal(
			appointmentsCsv.json.message,
			analyticsANL03.errorMessage,
			"A exportação de Agendamentos não recusou com a mensagem do gate.",
		)
		assertTs.equal(
			customers.json.message,
			analyticsANL03.errorMessage,
			"A aba Clientes não recusou com a mensagem do gate.",
		)
		assertTs.equal(
			customersCsv.json.message,
			analyticsANL03.errorMessage,
			"A exportação de Clientes não recusou com a mensagem do gate.",
		)
		assertTs.equal(
			appointments.json.statusCode,
			403,
			"Status code do corpo de erro divergente.",
		)
	})
})
