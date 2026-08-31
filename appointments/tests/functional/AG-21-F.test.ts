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
import postRescheduleAppointment from "@core/services/appointments/postRescheduleAppointment.service"
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { bookingAG21 } from "@appointments-data/booking.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let appointmentId: string
	let originalStartsAt: string
	let newStartsAt: string
	let serviceId: string

	before("Agendamento criado pelo admin, com uma segunda janela livre", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG21.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG21.casePrefix, adminParams)

		const scenario = await appointmentsBusiness.createAppointmentScenario(
			serviceBuilder
				.withName(bookingAG21.casePrefix)
				.withApprovalMode(bookingAG21.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG21.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG21.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG21.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG21.weekday, bookingAG21.startTime, bookingAG21.endTime)
				.build(),
			personBuilder
				.withName(bookingAG21.casePrefix)
				.withEmail(bookingAG21.casePrefix)
				.build(),
			bookingAG21.date,
			adminParams,
		)

		appointmentId = scenario.appointmentId
		serviceId = scenario.serviceId
		originalStartsAt = scenario.startsAt

		const slots = await appointmentsBusiness.adminSlots(
			serviceId,
			bookingAG21.date,
			bookingAG21.paramsDefault200(adminParams.token),
		)

		newStartsAt = slots[1].startsAt
	})

	it(`[AG-21-F]${bugTag(bookingAG21.knownBug)} - Reagendamento cancela o original, cria o substituto e encadeia os dois`, async () => {
		const { json } = await postRescheduleAppointment(
			appointmentId,
			{ startsAt: newStartsAt, reason: bookingAG21.rescheduleReason },
			bookingAG21.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			json.previous.status,
			bookingAG21.cancelledStatus,
			"O agendamento original não foi cancelado pelo reagendamento.",
		)

		assertTs.equal(
			json.replacement.startsAt,
			newStartsAt,
			"O agendamento substituto não ficou no horário novo.",
		)

		assertTs.exists(
			json.replacement.rescheduledFromId,
			bugMessage(
				"O substituto não aponta para o agendamento original.",
				bookingAG21.knownBug,
			),
		)

		assertTs.exists(
			json.previous.rescheduledToId,
			bugMessage(
				"O original não aponta para o agendamento substituto.",
				bookingAG21.knownBug,
			),
		)

		// A vaga antiga volta a ser oferecida e a nova sai da oferta.
		const freed = await appointmentsBusiness.isSlotFull(
			serviceId,
			bookingAG21.date,
			originalStartsAt,
			bookingAG21.paramsDefault200(adminParams.token),
		)

		assertTs.isFalse(
			freed,
			"A vaga do horário original não foi liberada pelo reagendamento.",
		)
	})
})
