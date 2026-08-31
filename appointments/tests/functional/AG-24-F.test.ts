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
import getListAppointments from "@core/services/appointments/getListAppointments.service"
import postCreateAppointment from "@core/services/appointments/postCreateAppointment.service"
import postCreateBlock from "@core/services/appointments/postCreateBlock.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { bookingAG24 } from "@appointments-data/booking.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let serviceId: string
	let professionalId: string
	let appointmentId: string
	let startsAt: string
	let endsAt: string
	let otherPersonId: string

	before("Janela com um agendamento já confirmado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG24.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG24.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG24.casePrefix)
				.withApprovalMode(bookingAG24.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG24.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG24.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG24.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG24.weekday, bookingAG24.startTime, bookingAG24.endTime)
				.build(),
			adminParams,
		)

		serviceId = bookable.serviceId
		professionalId = bookable.professionalId

		const person = await postCreatePerson(
			personBuilder
				.withName(bookingAG24.casePrefix)
				.withEmail(bookingAG24.casePrefix)
				.build(),
			bookingAG24.paramsDefault201(adminParams.token),
		)

		const other = await postCreatePerson(
			personBuilder
				.withName(bookingAG24.casePrefix)
				.withEmail(bookingAG24.casePrefix)
				.build(),
			bookingAG24.paramsDefault201(adminParams.token),
		)

		otherPersonId = other.json.id

		const slot = await appointmentsBusiness.firstAdminSlot(
			serviceId,
			bookingAG24.date,
			bookingAG24.paramsDefault200(adminParams.token),
		)

		startsAt = slot.startsAt
		endsAt = slot.endsAt

		const appointment = await postCreateAppointment(
			{ personId: person.json.id, serviceId, startsAt },
			bookingAG24.paramsDefault201(adminParams.token),
		)

		appointmentId = appointment.json.id
	})

	it("[AG-24-F] - Bloqueio recusa novas reservas na janela sem cancelar o agendamento existente", async () => {
		await postCreateBlock(
			{
				startsAt,
				endsAt,
				professionalId,
				serviceId,
				reason: bookingAG24.blockReason,
			},
			bookingAG24.paramsDefault201(adminParams.token),
		)

		await postCreateAppointment(
			{ personId: otherPersonId, serviceId, startsAt },
			bookingAG24.paramsDefault409(adminParams.token),
		)

		const preserved = await appointmentsBusiness.appointmentById(
			appointmentId,
			bookingAG24.date,
			bookingAG24.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			preserved.status,
			bookingAG24.expectedStatus,
			"O bloqueio mexeu no agendamento que já existia na janela.",
		)
	})
})
