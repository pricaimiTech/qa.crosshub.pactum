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
import patchUpdateAppointmentStatus from "@core/services/appointments/patchUpdateAppointmentStatus.service"
import postCreateAppointment from "@core/services/appointments/postCreateAppointment.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { bookingAG23 } from "@appointments-data/booking.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let appointmentId: string

	before("Agendamento já concluído — um dos cinco estados finais", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG23.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG23.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG23.casePrefix)
				.withApprovalMode(bookingAG23.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG23.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG23.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG23.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG23.weekday, bookingAG23.startTime, bookingAG23.endTime)
				.build(),
			adminParams,
		)

		const person = await postCreatePerson(
			personBuilder
				.withName(bookingAG23.casePrefix)
				.withEmail(bookingAG23.casePrefix)
				.build(),
			bookingAG23.paramsDefault201(adminParams.token),
		)

		const slot = await appointmentsBusiness.firstAdminSlot(
			bookable.serviceId,
			bookingAG23.date,
			bookingAG23.paramsDefault200(adminParams.token),
		)

		const appointment = await postCreateAppointment(
			{
				personId: person.json.id,
				serviceId: bookable.serviceId,
				startsAt: slot.startsAt,
			},
			bookingAG23.paramsDefault201(adminParams.token),
		)

		appointmentId = appointment.json.id

		await patchUpdateAppointmentStatus(
			appointmentId,
			{ status: bookingAG23.finalStatus },
			bookingAG23.paramsDefault200(adminParams.token),
		)
	})

	it("[AG-23-F] - Estado final não volta: completed não pode virar approved", async () => {
		const { json } = await patchUpdateAppointmentStatus(
			appointmentId,
			{ status: bookingAG23.forbiddenStatus },
			bookingAG23.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.message,
			bookingAG23.errorMessage,
			"A mensagem da transição inválida não é a especificada.",
		)
	})
})
