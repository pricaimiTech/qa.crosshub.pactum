import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	availabilityBuilder,
	describeName,
	peopleBusiness,
	personBuilder,
	professionalBuilder,
	serviceBuilder,
	serviceProfessionalLinkBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateAppointment from "@core/services/appointments/postCreateAppointment.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { bookingAG09 } from "@appointments-data/booking.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let serviceId: string
	let personId: string
	let secondStartsAt: string

	before("Pessoa com um agendamento criado pelo admin na data", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG09.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG09.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG09.casePrefix)
				.withApprovalMode(bookingAG09.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG09.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG09.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG09.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG09.weekday, bookingAG09.startTime, bookingAG09.endTime)
				.build(),
			adminParams,
		)

		serviceId = bookable.serviceId

		// Pessoa nova a cada execução: o caso não precisa de login do cliente,
		// então não consome o pool do preSetup.
		const person = await postCreatePerson(
			personBuilder
				.withName(bookingAG09.personPrefix)
				.withEmail(bookingAG09.personPrefix)
				.build(),
			bookingAG09.paramsDefault201(adminParams.token),
		)

		personId = person.json.id

		const slots = await appointmentsBusiness.adminSlots(
			serviceId,
			bookingAG09.date,
			bookingAG09.paramsDefault200(adminParams.token),
		)

		await postCreateAppointment(
			{ personId, serviceId, startsAt: slots[0].startsAt },
			bookingAG09.paramsDefault201(adminParams.token),
		)

		secondStartsAt = slots[1].startsAt
	})

	it("[AG-09-F] - Admin cria o segundo agendamento da mesma pessoa no mesmo dia", async () => {
		const { json } = await postCreateAppointment(
			{ personId, serviceId, startsAt: secondStartsAt },
			bookingAG09.paramsDefault201(adminParams.token),
		)

		assertTs.exists(
			json.id,
			"O admin foi barrado pela cota diária, que deveria valer só para o cliente.",
		)
	})
})
