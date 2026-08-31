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
import { bookingAG17 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let adminParams: IParamsDefault
	let lastClientParams: IParamsDefault
	let serviceId: string
	let startsAt: string

	before("Janela de capacidade 5 com as cinco vagas ocupadas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG17.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG17.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG17.casePrefix)
				.withApprovalMode(bookingAG17.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG17.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG17.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG17.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG17.weekday, bookingAG17.startTime, bookingAG17.endTime)
				.build(),
			adminParams,
		)

		serviceId = bookable.serviceId

		const clients = endUsersFor(bookingAG17.caseId)

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG17.date, bookingAG17.cleanupReason, adminParams)

		startsAt = (
			await appointmentsBusiness.firstAdminSlot(
				serviceId,
				bookingAG17.date,
				bookingAG17.paramsDefault200(adminParams.token),
			)
		).startsAt

		// Cinco clientes distintos: a cota de um por dia impede repetir o mesmo.
		await appointmentsBusiness.fillSlotWithClients(
			clients.slice(0, bookingAG17.capacity),
			`${process.env.TENANT_SLUG}`,
			serviceId,
			startsAt,
			adminParams,
		)

		const lastClient = clients[bookingAG17.capacity]

		lastClientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			lastClient.email,
			lastClient.password,
			bookingAG17.loginParams,
		)
	})

	it("[AG-17-F] - Sexta reserva em janela de capacidade 5 é recusada e a janela aparece lotada", async () => {
		await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG17.paramsDefault409(lastClientParams.token),
		)

		const isFull = await appointmentsBusiness.isSlotFull(
			serviceId,
			bookingAG17.date,
			startsAt,
			bookingAG17.paramsDefault200(adminParams.token),
		)

		assertTs.isTrue(
			isFull,
			"A janela continua oferecendo vaga depois de esgotar a capacidade.",
		)
	})
})
