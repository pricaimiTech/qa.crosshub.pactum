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
import postCreateBlock from "@core/services/appointments/postCreateBlock.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { analyticsANL03c } from "@analytics-data/analytics.data"

describe(describeName.dashboard, () => {
	const tenant = tenantFor(analyticsANL03c.caseId)
	let adminParams: IParamsDefault
	let professionalId: string

	before("Tenant próprio com o add-on ativo, 10 h de agenda, 2 h bloqueadas e 4 h aprovadas", async () => {
		const platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			analyticsANL03c.loginParams,
		)

		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL03c.addOnCode,
			"active",
			platformParams,
		)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			analyticsANL03c.loginParams,
		)

		await appointmentsBusiness.cancelAllAppointmentsOnDate(
			analyticsANL03c.date,
			analyticsANL03c.cleanupReason,
			adminParams,
		)
		await appointmentsBusiness.cleanupByPrefix(
			analyticsANL03c.casePrefix,
			adminParams,
		)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(analyticsANL03c.casePrefix)
				.withApprovalMode("automatic")
				.build(),
			professionalBuilder.withName(analyticsANL03c.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(analyticsANL03c.durationMinutes)
				.withCapacity(1)
				.build(),
			availabilityBuilder
				.withRule(
					analyticsANL03c.weekday,
					analyticsANL03c.startTime,
					analyticsANL03c.endTime,
				)
				.build(),
			adminParams,
		)
		professionalId = bookable.professionalId

		// As janelas vêm no fuso do tenant já convertidas: o bloqueio usa as duas
		// últimas do dia, sem precisar montar o instante à mão.
		const slots = await appointmentsBusiness.adminSlots(
			bookable.serviceId,
			analyticsANL03c.date,
			analyticsANL03c.paramsDefault200(adminParams.token),
		)

		await postCreateBlock(
			{
				professionalId,
				startsAt: slots[analyticsANL03c.blockFirstSlotIndex].startsAt,
				endsAt: slots[analyticsANL03c.blockLastSlotIndex].endsAt,
				reason: analyticsANL03c.blockReason,
			},
			analyticsANL03c.paramsDefault201(adminParams.token),
		)

		await appointmentsBusiness.bookAppointmentsForNewPeople(
			bookable.serviceId,
			analyticsANL03c.casePrefix,
			slots.slice(0, analyticsANL03c.appointments).map((slot) => slot.startsAt),
			adminParams,
		)
	})

	it("[ANL-03c-F] - Um bloqueio de 2 h sai do denominador: 4 h em 8 h dão 50% de ocupação", async () => {
		const { json } = await getAppointmentsAnalytics(
			{ from: analyticsANL03c.date, to: analyticsANL03c.date },
			analyticsANL03c.paramsDefault200(adminParams.token),
		)

		const own = (json.professionals as Array<IProfessionalOccupancy>).filter(
			(professional) => professional.id === professionalId,
		)

		assertTs.equal(
			own.length,
			1,
			"O profissional do caso não apareceu na lista de ocupação.",
		)
		assertTs.equal(
			own[0].availableMinutes,
			analyticsANL03c.expectedAvailableMinutes,
			"O bloqueio de 2 h não foi descontado das 10 h de agenda.",
		)
		assertTs.equal(
			own[0].scheduledMinutes,
			analyticsANL03c.expectedScheduledMinutes,
			"Os minutos agendados não correspondem aos 4 atendimentos de 60 min.",
		)
		assertTs.equal(
			own[0].occupancyPercent,
			analyticsANL03c.expectedOccupancyPercent,
			"A ocupação não considerou o bloqueio no denominador.",
		)
	})
})
