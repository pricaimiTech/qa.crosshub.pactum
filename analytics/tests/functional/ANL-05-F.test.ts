import {
	addonsBusiness,
	appointmentsBusiness,
	assertTs,
	authBusiness,
	availabilityBuilder,
	describeName,
	personBuilder,
	privacyBusiness,
	professionalBuilder,
	serviceBuilder,
	serviceProfessionalLinkBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import type { ITopSpender } from "@core/interfaces/analytics/IAnalytics.interface"
import getCustomersAnalytics from "@core/services/analytics/getCustomersAnalytics.service"
import { adminFor } from "@core/utils/admin.utils"
import { analyticsANL05 } from "@analytics-data/analytics.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let restrictedParams: IParamsDefault
	let personId: string
	let personEmail: string

	before("Add-on ativo, um atendimento no dia do caso e um admin sem autorização", async () => {
		const platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			analyticsANL05.loginParams,
		)
		const tenantId = await addonsBusiness.tenantIdBySlug(
			`${process.env.TENANT_SLUG}`,
			platformParams,
		)

		await addonsBusiness.setAddOnStatus(
			tenantId,
			analyticsANL05.addOnCode,
			"active",
			platformParams,
		)

		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			analyticsANL05.loginParams,
		)

		// O período consultado é o dia reservado ao caso: cancelar o que houver
		// nele deixa a pessoa criada aqui como única cliente ativa do período.
		await appointmentsBusiness.cancelAllAppointmentsOnDate(
			analyticsANL05.date,
			analyticsANL05.cleanupReason,
			primaryParams,
		)
		await appointmentsBusiness.cleanupByPrefix(
			analyticsANL05.casePrefix,
			primaryParams,
		)

		const person = personBuilder
			.withName(analyticsANL05.casePrefix)
			.withEmail(analyticsANL05.caseId)
			.build()
		personEmail = `${person.email}`

		const scenario = await appointmentsBusiness.createAppointmentScenario(
			serviceBuilder
				.withName(analyticsANL05.casePrefix)
				.withApprovalMode("automatic")
				.build(),
			professionalBuilder.withName(analyticsANL05.casePrefix).build(),
			serviceProfessionalLinkBuilder.build(),
			availabilityBuilder
				.withRule(
					analyticsANL05.weekday,
					analyticsANL05.startTime,
					analyticsANL05.endTime,
				)
				.build(),
			person,
			analyticsANL05.date,
			primaryParams,
		)
		personId = scenario.personId

		const restricted = adminFor(analyticsANL05.caseId)

		await privacyBusiness.setSensitiveAccess(
			restricted.adminId,
			false,
			primaryParams,
		)

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			analyticsANL05.loginParams,
		)
	})

	it("[ANL-05-F] - A aba Clientes devolve e-mail e telefone nulos ao admin sem autorização para dado sensível", async () => {
		const period = { from: analyticsANL05.date, to: analyticsANL05.date }

		const restricted = await getCustomersAnalytics(
			period,
			analyticsANL05.paramsDefault200(restrictedParams.token),
		)
		const primary = await getCustomersAnalytics(
			period,
			analyticsANL05.paramsDefault200(primaryParams.token),
		)

		const maskedRows = (restricted.json.topSpenders as Array<ITopSpender>).filter(
			(row) => row.personId === personId,
		)
		const openRows = (primary.json.topSpenders as Array<ITopSpender>).filter(
			(row) => row.personId === personId,
		)

		assertTs.equal(
			maskedRows.length,
			1,
			"A cliente do caso não apareceu entre os maiores clientes para o admin restrito.",
		)
		assertTs.isNull(
			maskedRows[0].email,
			"O e-mail da cliente vazou para o admin sem autorização.",
		)
		assertTs.isNull(
			maskedRows[0].phone,
			"O telefone da cliente vazou para o admin sem autorização.",
		)
		assertTs.equal(
			openRows.length,
			1,
			"A cliente do caso não apareceu entre os maiores clientes para o admin principal.",
		)
		assertTs.equal(
			openRows[0].email,
			personEmail,
			"O admin principal deveria ver o e-mail da cliente.",
		)
		assertTs.equal(
			restricted.json.cards.activeCustomers,
			primary.json.cards.activeCustomers,
			"A permissão de dado sensível alterou o agregado de clientes ativos, que não é sensível.",
		)
	})
})
