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
import postPublicCreateAppointment from "@core/services/public/postPublicCreateAppointment.service"
import postPublicRescheduleAppointment from "@core/services/public/postPublicRescheduleAppointment.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { bookingAG22 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let appointmentId: string
	let startsAt: string

	before("Cliente com um agendamento confirmado", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG22.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG22.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG22.casePrefix)
				.withApprovalMode(bookingAG22.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG22.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG22.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG22.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG22.weekday, bookingAG22.startTime, bookingAG22.endTime)
				.build(),
			adminParams,
		)

		const person = endUsersFor(bookingAG22.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG22.date, bookingAG22.cleanupReason, adminParams)

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG22.loginParams,
		)

		const slot = await appointmentsBusiness.firstPublicSlot(
			bookable.serviceId,
			bookingAG22.date,
			bookingAG22.paramsDefault200(clientParams.token),
		)

		startsAt = slot.startsAt

		const created = await postPublicCreateAppointment(
			{ serviceId: bookable.serviceId, startsAt },
			bookingAG22.paramsDefault201(clientParams.token),
		)

		appointmentId = created.json.id
	})

	it("[AG-22-F] - Reagendamento pelo cliente não existe na API: a rota documentada devolve 404", async () => {
		const { json } = await postPublicRescheduleAppointment(
			appointmentId,
			{ startsAt, reason: bookingAG22.rescheduleReason },
			bookingAG22.paramsDefault404(clientParams.token),
		)

		assertTs.equal(
			json.statusCode,
			404,
			"A rota de reagendamento do cliente respondeu algo diferente de 404 — a divergência entre especificação e código mudou.",
		)
	})
})
