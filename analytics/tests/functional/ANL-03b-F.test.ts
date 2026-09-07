import {
	addonsBusiness,
	appointmentsBusiness,
	assertTs,
	authBusiness,
	availabilityBuilder,
	describeName,
	professionalBuilder,
	serviceBuilder,
	serviceProfessionalLinkBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import type { IProfessionalOccupancy } from "@core/interfaces/analytics/IAnalytics.interface"
import getAppointmentsAnalytics from "@core/services/analytics/getAppointmentsAnalytics.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { analyticsANL03b } from "@analytics-data/analytics.data"

describe(describeName.dashboard, () => {
	const tenant = tenantFor(analyticsANL03b.caseId)
	let adminParams: IParamsDefault
	let professionalId: string

	before("Tenant próprio com o add-on ativo, 10 h de agenda e 4 h aprovadas no dia", async () => {
		const platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			analyticsANL03b.loginParams,
		)

		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL03b.addOnCode,
			"active",
			platformParams,
		)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			analyticsANL03b.loginParams,
		)

		// Profissional exclusivo por execução: a massa acumulada de execuções
		// anteriores fica em outros profissionais e não entra na conta deste.
		await appointmentsBusiness.cancelAllAppointmentsOnDate(
			analyticsANL03b.date,
			analyticsANL03b.cleanupReason,
			adminParams,
		)
		await appointmentsBusiness.cleanupByPrefix(
			analyticsANL03b.casePrefix,
			adminParams,
		)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(analyticsANL03b.casePrefix)
				.withApprovalMode("automatic")
				.build(),
			professionalBuilder.withName(analyticsANL03b.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(analyticsANL03b.durationMinutes)
				.withCapacity(1)
				.build(),
			availabilityBuilder
				.withRule(
					analyticsANL03b.weekday,
					analyticsANL03b.startTime,
					analyticsANL03b.endTime,
				)
				.build(),
			adminParams,
		)
		professionalId = bookable.professionalId

		const slots = await appointmentsBusiness.adminSlots(
			bookable.serviceId,
			analyticsANL03b.date,
			analyticsANL03b.paramsDefault200(adminParams.token),
		)

		await appointmentsBusiness.bookAppointmentsForNewPeople(
			bookable.serviceId,
			analyticsANL03b.casePrefix,
			slots.slice(0, analyticsANL03b.appointments).map((slot) => slot.startsAt),
			adminParams,
		)
	})

	it("[ANL-03b-F] - 10 h de disponibilidade com 4 h de atendimentos aprovados dão 40% de ocupação", async () => {
		const { json } = await getAppointmentsAnalytics(
			{ from: analyticsANL03b.date, to: analyticsANL03b.date },
			analyticsANL03b.paramsDefault200(adminParams.token),
		)

		const own = (json.professionals as Array<IProfessionalOccupancy>).filter(
			(professional) => professional.id === professionalId,
		)

		assertTs.equal(
			json.period.from,
			analyticsANL03b.date,
			"A API não devolveu o período consultado.",
		)
		assertTs.equal(
			own.length,
			1,
			"O profissional do caso não apareceu na lista de ocupação.",
		)
		assertTs.isTrue(
			own[0].hasAvailability,
			"O profissional com agenda cadastrada veio sem disponibilidade.",
		)
		assertTs.equal(
			own[0].availableMinutes,
			analyticsANL03b.expectedAvailableMinutes,
			"Os minutos disponíveis não correspondem às 10 h de agenda do dia.",
		)
		assertTs.equal(
			own[0].scheduledMinutes,
			analyticsANL03b.expectedScheduledMinutes,
			"Os minutos agendados não correspondem aos 4 atendimentos de 60 min.",
		)
		assertTs.equal(
			own[0].occupancyPercent,
			analyticsANL03b.expectedOccupancyPercent,
			"A ocupação do profissional não é 40%.",
		)
	})
})
