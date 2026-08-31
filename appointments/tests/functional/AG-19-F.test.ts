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
import putSaveSettings from "@core/services/appointments/putSaveSettings.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { bookingAG19 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let insideParams: IParamsDefault
	let outsideParams: IParamsDefault
	let insideAppointmentId: string
	let outsideAppointmentId: string

	before(
		"Dois agendamentos do mesmo serviço: um dentro do prazo de 24 h, outro fora",
		async () => {
			const adminParams = await authBusiness.loginAsTenantAdmin(
				`${process.env.TENANT_SLUG}`,
				`${process.env.TENANT_EMAIL}`,
				`${process.env.TENANT_PASSWORD}`,
				bookingAG19.loginParams,
			)

			await appointmentsBusiness.cleanupByPrefix(
				bookingAG19.casePrefix,
				adminParams,
			)

			await putSaveSettings(
				{
					timezone: bookingAG19.timezone,
					cancellationNoticeHours: bookingAG19.cancellationNoticeHours,
					restoreCreditOnLateCancellation: false,
					restoreCreditOnNoShow: false,
					restoreCreditOnAdminCancellation: true,
				},
				bookingAG19.paramsDefault200(adminParams.token),
			)

			const bookable = await appointmentsBusiness.createBookableService(
				serviceBuilder
					.withName(bookingAG19.casePrefix)
					.withApprovalMode(bookingAG19.approvalMode)
					.build(),
				professionalBuilder.withName(bookingAG19.casePrefix).build(),
				serviceProfessionalLinkBuilder
					.withDurationMinutes(bookingAG19.durationMinutes)
					.withIntervalMinutes(0)
					.withCapacity(bookingAG19.capacity)
					.build(),
				availabilityBuilder
					.reset()
					.withRule(
						bookingAG19.insideWindow.weekday,
						bookingAG19.insideWindow.startTime,
						bookingAG19.insideWindow.endTime,
					)
					.withRule(
						bookingAG19.outsideWindow.weekday,
						bookingAG19.outsideWindow.startTime,
						bookingAG19.outsideWindow.endTime,
						"afternoon",
					)
					.build(),
				adminParams,
			)

			const clients = endUsersFor(bookingAG19.caseId)

			await appointmentsBusiness.cancelAllAppointmentsInRange([bookingAG19.insideWindow.date, bookingAG19.outsideWindow.date], bookingAG19.cleanupReason, adminParams)

			insideParams = await authBusiness.loginAsEndUser(
				`${process.env.TENANT_SLUG}`,
				clients[0].email,
				clients[0].password,
				bookingAG19.loginParams,
			)
			outsideParams = await authBusiness.loginAsEndUser(
				`${process.env.TENANT_SLUG}`,
				clients[1].email,
				clients[1].password,
				bookingAG19.loginParams,
			)

			// As duas faixas podem cair no mesmo dia, então cada agendamento é
			// feito na janela do seu próprio horário, não na primeira livre.
			const insideSlot = await appointmentsBusiness.publicSlotAtTime(
				bookable.serviceId,
				bookingAG19.insideWindow.date,
				bookingAG19.insideWindow.startTime,
				bookingAG19.paramsDefault200(insideParams.token),
			)
			const outsideSlot = await appointmentsBusiness.publicSlotAtTime(
				bookable.serviceId,
				bookingAG19.outsideWindow.date,
				bookingAG19.outsideWindow.startTime,
				bookingAG19.paramsDefault200(outsideParams.token),
			)

			insideAppointmentId = (
				await postPublicCreateAppointment(
					{ serviceId: bookable.serviceId, startsAt: insideSlot.startsAt },
					bookingAG19.paramsDefault201(insideParams.token),
				)
			).json.id

			outsideAppointmentId = (
				await postPublicCreateAppointment(
					{ serviceId: bookable.serviceId, startsAt: outsideSlot.startsAt },
					bookingAG19.paramsDefault201(outsideParams.token),
				)
			).json.id
		},
	)

	it("[AG-19-F] - Cliente não cancela dentro do prazo de 24 h, mas cancela fora dele", async () => {
		const refused = await postPublicCancelAppointment(
			insideAppointmentId,
			{ reason: bookingAG19.cancelReason },
			bookingAG19.paramsDefault409(insideParams.token),
		)

		assertTs.equal(
			refused.json.message,
			bookingAG19.errorMessage,
			"A mensagem do prazo de cancelamento não é a especificada.",
		)

		const accepted = await postPublicCancelAppointment(
			outsideAppointmentId,
			{ reason: bookingAG19.cancelReason },
			bookingAG19.paramsDefault201(outsideParams.token),
		)

		assertTs.equal(
			accepted.json.status,
			"cancelled_by_client",
			"O cancelamento fora do prazo de 24 h não foi aceito.",
		)
	})
})
