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
import postCreateBlock from "@core/services/appointments/postCreateBlock.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { bookingAG25 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let serviceId: string
	let blockedProfessionalId: string
	let availableProfessionalId: string
	let startsAt: string

	before("Dois profissionais na mesma janela, com um deles bloqueado", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG25.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG25.casePrefix, adminParams)

		blockedProfessionalId =
			await appointmentsBusiness.createProfessionalWithAvailability(
				professionalBuilder.withName(bookingAG25.casePrefix).build(),
				availabilityBuilder
					.reset()
					.withRule(bookingAG25.weekday, bookingAG25.startTime, bookingAG25.endTime)
					.build(),
				adminParams,
			)

		availableProfessionalId =
			await appointmentsBusiness.createProfessionalWithAvailability(
				professionalBuilder.withName(bookingAG25.casePrefix).build(),
				availabilityBuilder
					.reset()
					.withRule(bookingAG25.weekday, bookingAG25.startTime, bookingAG25.endTime)
					.build(),
				adminParams,
			)

		serviceId = await appointmentsBusiness.createServiceWithProfessionals(
			serviceBuilder
				.withName(bookingAG25.casePrefix)
				.withApprovalMode(bookingAG25.approvalMode)
				.build(),
			[
				{
					...serviceProfessionalLinkBuilder
						.withDurationMinutes(bookingAG25.durationMinutes)
						.withIntervalMinutes(0)
						.withCapacity(bookingAG25.capacity)
						.build(),
					professionalId: blockedProfessionalId,
				},
				{
					...serviceProfessionalLinkBuilder
						.withDurationMinutes(bookingAG25.durationMinutes)
						.withIntervalMinutes(0)
						.withCapacity(bookingAG25.capacity)
						.build(),
					professionalId: availableProfessionalId,
				},
			],
			adminParams,
		)

		const slot = await appointmentsBusiness.firstAdminSlot(
			serviceId,
			bookingAG25.date,
			bookingAG25.paramsDefault200(adminParams.token),
		)

		startsAt = slot.startsAt

		await postCreateBlock(
			{
				startsAt,
				endsAt: slot.endsAt,
				professionalId: blockedProfessionalId,
				reason: bookingAG25.blockReason,
			},
			bookingAG25.paramsDefault201(adminParams.token),
		)

		const person = endUsersFor(bookingAG25.caseId)[0]

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG25.loginParams,
		)
	})

	it("[AG-25-F] - Bloquear um dos profissionais não fecha a janela: o outro continua atendendo", async () => {
		const slot = await appointmentsBusiness.publicSlotAtStartsAt(
			serviceId,
			bookingAG25.date,
			startsAt,
			bookingAG25.paramsDefault200(clientParams.token),
		)

		assertTs.equal(
			slot.professionalId,
			availableProfessionalId,
			"A janela deixou de ser oferecida ou ficou com o profissional bloqueado.",
		)
	})
})
