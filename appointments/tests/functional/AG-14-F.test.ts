import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	availabilityBuilder,
	describeName,
	professionalBuilder,
	serviceBuilder,
	serviceProfessionalLinkBuilder,
} from "@core/constants"
import { endUsersFor } from "@core/utils/endUser.utils"
import { bookingAG14 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let chosen: Array<string>

	before("Dois profissionais elegíveis, com a mesma agenda e nenhuma ocupação", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG14.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG14.casePrefix, adminParams)

		const firstProfessionalId =
			await appointmentsBusiness.createProfessionalWithAvailability(
				professionalBuilder.withName(bookingAG14.casePrefix).build(),
				availabilityBuilder
					.reset()
					.withRuleOnWeekdays(
						bookingAG14.weekdays,
						bookingAG14.startTime,
						bookingAG14.endTime,
					)
					.build(),
				adminParams,
			)

		const secondProfessionalId =
			await appointmentsBusiness.createProfessionalWithAvailability(
				professionalBuilder.withName(bookingAG14.casePrefix).build(),
				availabilityBuilder
					.reset()
					.withRuleOnWeekdays(
						bookingAG14.weekdays,
						bookingAG14.startTime,
						bookingAG14.endTime,
					)
					.build(),
				adminParams,
			)

		const serviceId = await appointmentsBusiness.createServiceWithProfessionals(
			serviceBuilder
				.withName(bookingAG14.casePrefix)
				.withApprovalMode(bookingAG14.approvalMode)
				.build(),
			[
				{
					...serviceProfessionalLinkBuilder
						.withDurationMinutes(bookingAG14.durationMinutes)
						.withIntervalMinutes(0)
						.withCapacity(bookingAG14.capacity)
						.build(),
					professionalId: firstProfessionalId,
					sortOrder: 0,
				},
				{
					...serviceProfessionalLinkBuilder
						.withDurationMinutes(bookingAG14.durationMinutes)
						.withIntervalMinutes(0)
						.withCapacity(bookingAG14.capacity)
						.build(),
					professionalId: secondProfessionalId,
					sortOrder: 1,
				},
			],
			adminParams,
		)

		const client = endUsersFor(bookingAG14.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsInRange(bookingAG14.dates, bookingAG14.cleanupReason, adminParams)

		chosen = await appointmentsBusiness.professionalsChosenAcrossDates(
			client,
			`${process.env.TENANT_SLUG}`,
			serviceId,
			bookingAG14.dates,
			bookingAG14.paramsDefault200(adminParams.token),
		)
	})

	it("[AG-14-F] - Com ocupação empatada, a distribuição escolhe sempre o mesmo profissional", async () => {
		const distintos = [...new Set(chosen)]

		assertTs.lengthOf(
			distintos,
			1,
			`O desempate não foi determinístico: em ${bookingAG14.rounds} execuções idênticas a distribuição escolheu ${distintos.length} profissionais diferentes.`,
		)
	})
})
