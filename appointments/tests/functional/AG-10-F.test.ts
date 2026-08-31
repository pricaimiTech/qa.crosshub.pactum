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
import { bookingAG10 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let adminParams: IParamsDefault
	let clientParams: IParamsDefault
	let serviceId: string
	let startsAt: string

	before("Serviço com aprovação manual e cliente sem agendamento no dia", async () => {
		const authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG10.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG10.casePrefix, authParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG10.casePrefix)
				.withApprovalMode(bookingAG10.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG10.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG10.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG10.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG10.weekday, bookingAG10.startTime, bookingAG10.endTime)
				.build(),
			authParams,
		)

		serviceId = bookable.serviceId

		const person = endUsersFor(bookingAG10.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG10.date, bookingAG10.cleanupReason, authParams)

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG10.loginParams,
		)

		const slot = await appointmentsBusiness.firstPublicSlot(
			serviceId,
			bookingAG10.date,
			bookingAG10.paramsDefault200(clientParams.token),
		)

		startsAt = slot.startsAt

		adminParams = authParams
	})

	it("[AG-10-F] - Aprovação manual nasce pending e já consome a capacidade da janela", async () => {
		const { json } = await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG10.paramsDefault201(clientParams.token),
		)

		assertTs.equal(
			json.status,
			bookingAG10.expectedStatus,
			"O agendamento em serviço de aprovação manual não nasceu pending.",
		)

		const slot = await appointmentsBusiness.firstAdminSlot(
			serviceId,
			bookingAG10.date,
			bookingAG10.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			slot.occupied,
			bookingAG10.expectedOccupied,
			"A janela não perdeu capacidade com o agendamento pendente (ADR-004).",
		)
	})
})
