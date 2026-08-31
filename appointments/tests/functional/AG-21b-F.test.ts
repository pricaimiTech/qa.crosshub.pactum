import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	availabilityBuilder,
	describeName,
	personBuilder,
	professionalBuilder,
	serviceBuilder,
	serviceProfessionalLinkBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { validationsAG21b } from "@appointments-data/validations.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let appointmentId: string
	let startsAt: string

	before("Agendamento criado pelo admin", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			validationsAG21b.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			validationsAG21b.casePrefix,
			adminParams,
		)

		const scenario = await appointmentsBusiness.createAppointmentScenario(
			serviceBuilder.withName(validationsAG21b.casePrefix).build(),
			professionalBuilder.withName(validationsAG21b.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(validationsAG21b.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(validationsAG21b.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					validationsAG21b.weekday,
					validationsAG21b.startTime,
					validationsAG21b.endTime,
				)
				.build(),
			personBuilder
				.withName(validationsAG21b.casePrefix)
				.withEmail(validationsAG21b.casePrefix)
				.build(),
			validationsAG21b.date,
			adminParams,
		)

		appointmentId = scenario.appointmentId
		startsAt = scenario.startsAt
	})

	it("[AG-21b-F] - Reagendamento sem horário novo ou sem motivo é recusado", async () => {
		const semHorario = await appointmentsBusiness.rejectedReschedule(
			appointmentId,
			{ reason: validationsAG21b.rescheduleReason },
			validationsAG21b.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			semHorario,
			validationsAG21b.errorMessage,
			"O reagendamento sem horário novo não trouxe a mensagem especificada.",
		)

		const semMotivo = await appointmentsBusiness.rejectedReschedule(
			appointmentId,
			{ startsAt },
			validationsAG21b.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			semMotivo,
			validationsAG21b.errorMessage,
			"O reagendamento sem motivo não trouxe a mensagem especificada.",
		)
	})
})
