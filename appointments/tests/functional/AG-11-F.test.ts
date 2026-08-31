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
import { endUsersFor } from "@core/utils/endUser.utils"
import { bookingAG11 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let serviceId: string
	let startsAt: string

	before("Serviço com aprovação automática e cliente final ativado", async () => {
		const authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG11.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG11.casePrefix, authParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG11.casePrefix)
				.withApprovalMode(bookingAG11.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG11.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG11.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG11.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG11.weekday, bookingAG11.startTime, bookingAG11.endTime)
				.build(),
			authParams,
		)

		serviceId = bookable.serviceId

		const person = endUsersFor(bookingAG11.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG11.date, bookingAG11.cleanupReason, authParams)

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG11.loginParams,
		)

		const slot = await appointmentsBusiness.firstPublicSlot(
			serviceId,
			bookingAG11.date,
			bookingAG11.paramsDefault200(clientParams.token),
		)

		startsAt = slot.startsAt
	})

	it("[AG-11-F] - Serviço com aprovação automática nasce approved, sem passar por pending", async () => {
		const { json } = await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG11.paramsDefault201(clientParams.token),
		)

		assertTs.equal(
			json.status,
			bookingAG11.expectedStatus,
			"O agendamento em serviço de aprovação automática não nasceu approved.",
		)
	})
})
