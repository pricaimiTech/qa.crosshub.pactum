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
import { bookingAG15 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let serviceId: string
	let startsAt: string
	let idleProfessionalId: string

	before(
		"Serviço com dois profissionais: um atende a janela, o outro só à tarde",
		async () => {
			const adminParams = await authBusiness.loginAsTenantAdmin(
				`${process.env.TENANT_SLUG}`,
				`${process.env.TENANT_EMAIL}`,
				`${process.env.TENANT_PASSWORD}`,
				bookingAG15.loginParams,
			)

			await appointmentsBusiness.cleanupByPrefix(
				bookingAG15.casePrefix,
				adminParams,
			)

			const workingProfessionalId =
				await appointmentsBusiness.createProfessionalWithAvailability(
					professionalBuilder.withName(bookingAG15.casePrefix).build(),
					availabilityBuilder
						.reset()
						.withRule(
							bookingAG15.weekday,
							bookingAG15.startTime,
							bookingAG15.endTime,
						)
						.build(),
					adminParams,
				)

			idleProfessionalId =
				await appointmentsBusiness.createProfessionalWithAvailability(
					professionalBuilder.withName(bookingAG15.casePrefix).build(),
					availabilityBuilder
						.reset()
						.withRule(
							bookingAG15.weekday,
							bookingAG15.idleStartTime,
							bookingAG15.idleEndTime,
							bookingAG15.idleShift,
						)
						.build(),
					adminParams,
				)

			serviceId = await appointmentsBusiness.createServiceWithProfessionals(
				serviceBuilder
					.withName(bookingAG15.casePrefix)
					.withApprovalMode(bookingAG15.approvalMode)
					.build(),
				[
					{
						...serviceProfessionalLinkBuilder
							.withDurationMinutes(bookingAG15.durationMinutes)
							.withIntervalMinutes(0)
							.withCapacity(bookingAG15.capacity)
							.build(),
						professionalId: workingProfessionalId,
					},
					{
						...serviceProfessionalLinkBuilder
							.withDurationMinutes(bookingAG15.durationMinutes)
							.withIntervalMinutes(0)
							.withCapacity(bookingAG15.capacity)
							.build(),
						professionalId: idleProfessionalId,
					},
				],
				adminParams,
			)

			const person = endUsersFor(bookingAG15.caseId)[0]

			await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG15.date, bookingAG15.cleanupReason, adminParams)

			clientParams = await authBusiness.loginAsEndUser(
				`${process.env.TENANT_SLUG}`,
				person.email,
				person.password,
				bookingAG15.loginParams,
			)

			// A lista de janelas não vem ordenada por horário: o profissional da
			// tarde aparece primeiro. O caso precisa da janela da manhã, que é
			// justamente aquela que o segundo profissional não gera.
			const slot = await appointmentsBusiness.publicSlotAtTime(
				serviceId,
				bookingAG15.date,
				bookingAG15.startTime,
				bookingAG15.paramsDefault200(clientParams.token),
			)

			startsAt = slot.startsAt
		},
	)

	it("[AG-15-F] - Distribuição ignora profissional vinculado que não gera aquela janela", async () => {
		const { json } = await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG15.paramsDefault201(clientParams.token),
		)

		assertTs.notEqual(
			json.professionalId,
			idleProfessionalId,
			"A distribuição escolheu um profissional sem disponibilidade na janela.",
		)
	})
})
