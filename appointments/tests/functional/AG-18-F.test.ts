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
import { bookingAG18 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let secondClientParams: IParamsDefault
	let serviceId: string
	let startsAt: string

	before("Janela de vaga única, ocupada e depois liberada pelo cancelamento", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG18.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG18.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG18.casePrefix)
				.withApprovalMode(bookingAG18.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG18.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG18.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG18.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG18.weekday, bookingAG18.startTime, bookingAG18.endTime)
				.build(),
			adminParams,
		)

		serviceId = bookable.serviceId

		const clients = endUsersFor(bookingAG18.caseId)

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG18.date, bookingAG18.cleanupReason, adminParams)

		const firstClientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			clients[0].email,
			clients[0].password,
			bookingAG18.loginParams,
		)

		startsAt = (
			await appointmentsBusiness.firstPublicSlot(
				serviceId,
				bookingAG18.date,
				bookingAG18.paramsDefault200(firstClientParams.token),
			)
		).startsAt

		const created = await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG18.paramsDefault201(firstClientParams.token),
		)

		secondClientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			clients[1].email,
			clients[1].password,
			bookingAG18.loginParams,
		)

		// Com a vaga única ocupada, o segundo cliente é recusado.
		await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG18.paramsDefault409(secondClientParams.token),
		)

		await postPublicCancelAppointment(
			created.json.id,
			{ reason: bookingAG18.cancelReason },
			bookingAG18.paramsDefault201(firstClientParams.token),
		)
	})

	it("[AG-18-F] - Cancelar libera a vaga e a janela volta a aceitar agendamento", async () => {
		const { json } = await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG18.paramsDefault201(secondClientParams.token),
		)

		assertTs.exists(
			json.id,
			"A janela não voltou a aceitar agendamento depois do cancelamento.",
		)
	})
})
