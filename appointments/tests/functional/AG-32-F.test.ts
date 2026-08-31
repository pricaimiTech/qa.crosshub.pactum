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
import getPublicMyAppointments from "@core/services/public/getPublicMyAppointments.service"
import postCreateAppointment from "@core/services/appointments/postCreateAppointment.service"
import postCreateBlock from "@core/services/appointments/postCreateBlock.service"
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { endUsersFor } from "@core/utils/endUser.utils"
import { bookingAG32 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault

	before("Agendamento com nota interna e bloqueio com motivo na mesma agenda", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG32.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG32.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG32.casePrefix)
				.withApprovalMode(bookingAG32.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG32.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG32.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG32.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG32.weekday, bookingAG32.startTime, bookingAG32.endTime)
				.build(),
			adminParams,
		)

		const person = endUsersFor(bookingAG32.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG32.date, bookingAG32.cleanupReason, adminParams)

		const slots = await appointmentsBusiness.adminSlots(
			bookable.serviceId,
			bookingAG32.date,
			bookingAG32.paramsDefault200(adminParams.token),
		)

		await postCreateAppointment(
			{
				personId: person.personId,
				serviceId: bookable.serviceId,
				startsAt: slots[0].startsAt,
				notes: bookingAG32.internalNote,
			},
			bookingAG32.paramsDefault201(adminParams.token),
		)

		await postCreateBlock(
			{
				startsAt: slots[1].startsAt,
				endsAt: slots[1].endsAt,
				professionalId: bookable.professionalId,
				serviceId: bookable.serviceId,
				reason: bookingAG32.blockReason,
			},
			bookingAG32.paramsDefault201(adminParams.token),
		)

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG32.loginParams,
		)
	})

	it(`[AG-32-F]${bugTag(bookingAG32.knownBug)} - Notas internas e motivo de bloqueio não aparecem no app do cliente`, async () => {
		const { json } = await getPublicMyAppointments(
			bookingAG32.paramsDefault200(clientParams.token),
		)

		const payload = JSON.stringify(json)

		assertTs.notInclude(
			payload,
			bookingAG32.internalNote,
			bugMessage(
				"A nota interna do admin vazou para o app do cliente.",
				bookingAG32.knownBug,
			),
		)

		assertTs.notInclude(
			payload,
			bookingAG32.blockReason,
			bugMessage(
				"O motivo do bloqueio vazou para o app do cliente.",
				bookingAG32.knownBug,
			),
		)
	})
})
