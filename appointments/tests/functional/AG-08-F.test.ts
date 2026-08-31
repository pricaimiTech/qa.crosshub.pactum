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
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postPublicCancelAppointment from "@core/services/public/postPublicCancelAppointment.service"
import postPublicCreateAppointment from "@core/services/public/postPublicCreateAppointment.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { bookingAG08 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let serviceId: string
	let startsAt: string

	before("Cliente que agendou e cancelou o agendamento do dia", async () => {
		const authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG08.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG08.casePrefix, authParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG08.casePrefix)
				.withApprovalMode(bookingAG08.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG08.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG08.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG08.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG08.weekday, bookingAG08.startTime, bookingAG08.endTime)
				.build(),
			authParams,
		)

		serviceId = bookable.serviceId

		const person = endUsersFor(bookingAG08.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG08.date, bookingAG08.cleanupReason, authParams)

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG08.loginParams,
		)

		const slot = await appointmentsBusiness.firstPublicSlot(
			serviceId,
			bookingAG08.date,
			bookingAG08.paramsDefault200(clientParams.token),
		)

		startsAt = slot.startsAt

		const created = await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG08.paramsDefault201(clientParams.token),
		)

		await postPublicCancelAppointment(
			created.json.id,
			{ reason: bookingAG08.cancelReason },
			bookingAG08.paramsDefault201(clientParams.token),
		)
	})

	it("[AG-08-F] - Agendamento cancelado não ocupa a cota diária do cliente", async () => {
		const { json } = await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG08.paramsDefault201(clientParams.token),
		)

		assertTs.exists(
			json.id,
			"O cliente não conseguiu reagendar no dia em que já havia cancelado.",
		)
	})
})
