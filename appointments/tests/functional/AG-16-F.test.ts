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
import { bookingAG16 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let rounds: Array<Array<number>>

	before("Vinte janelas de vaga única, uma por data, e dois clientes", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG16.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG16.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG16.casePrefix)
				.withApprovalMode(bookingAG16.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG16.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG16.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG16.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRuleOnWeekdays(
					bookingAG16.weekdays,
					bookingAG16.startTime,
					bookingAG16.endTime,
				)
				.build(),
			adminParams,
		)

		const clients = endUsersFor(bookingAG16.caseId)

		await appointmentsBusiness.cancelAllAppointmentsInRange(bookingAG16.dates, bookingAG16.cleanupReason, adminParams)

		rounds = await appointmentsBusiness.raceForLastSlot(
			clients,
			`${process.env.TENANT_SLUG}`,
			bookable.serviceId,
			bookingAG16.dates,
			bookingAG16.paramsDefault200(adminParams.token),
		)
	})

	it("[AG-16-F] - Duas reservas simultâneas na última vaga: uma 201 e uma 409, nunca duas confirmadas", async () => {
		const unexpected = rounds.filter(
			(round) => round.join(",") !== bookingAG16.expectedRound.join(","),
		)

		assertTs.deepEqual(
			unexpected,
			[],
			`Em ${unexpected.length} das ${bookingAG16.rounds} rodadas a disputa não terminou em 201 + 409 — a última vaga foi vendida duas vezes ou negada às duas.`,
		)
	})
})
