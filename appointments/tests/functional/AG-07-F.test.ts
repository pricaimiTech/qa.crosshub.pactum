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
import { bookingAG07 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let secondServiceId: string
	let secondStartsAt: string

	before("Cliente com um agendamento ativo no dia, em outro serviço", async () => {
		const authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG07.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG07.casePrefix, authParams)

		const firstService = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG07.casePrefix)
				.withApprovalMode(bookingAG07.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG07.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG07.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG07.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG07.weekday, bookingAG07.startTime, bookingAG07.endTime)
				.build(),
			authParams,
		)

		const secondService = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG07.casePrefix)
				.withApprovalMode(bookingAG07.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG07.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG07.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG07.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG07.weekday, bookingAG07.startTime, bookingAG07.endTime)
				.build(),
			authParams,
		)

		secondServiceId = secondService.serviceId

		const person = endUsersFor(bookingAG07.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG07.date, bookingAG07.cleanupReason, authParams)

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG07.loginParams,
		)

		// A janela do segundo serviço é lida antes: depois da primeira reserva o
		// dia fica bloqueado e a disponibilidade volta vazia.
		secondStartsAt = (
			await appointmentsBusiness.firstPublicSlot(
				secondServiceId,
				bookingAG07.date,
				bookingAG07.paramsDefault200(clientParams.token),
			)
		).startsAt

		const firstSlot = await appointmentsBusiness.firstPublicSlot(
			firstService.serviceId,
			bookingAG07.date,
			bookingAG07.paramsDefault200(clientParams.token),
		)

		await postPublicCreateAppointment(
			{ serviceId: firstService.serviceId, startsAt: firstSlot.startsAt },
			bookingAG07.paramsDefault201(clientParams.token),
		)
	})

	it("[AG-07-F] - Cliente com agendamento ativo no dia não consegue outro, nem em serviço diferente", async () => {
		const { json } = await postPublicCreateAppointment(
			{ serviceId: secondServiceId, startsAt: secondStartsAt },
			bookingAG07.paramsDefault409(clientParams.token),
		)

		assertTs.equal(
			json.message,
			bookingAG07.errorMessage,
			"A mensagem da cota diária não é a especificada.",
		)
	})
})
