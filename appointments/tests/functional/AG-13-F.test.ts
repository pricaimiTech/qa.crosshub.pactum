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
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { endUsersFor } from "@core/utils/endUser.utils"
import { bookingAG13 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let serviceId: string
	let startsAt: string

	before("Serviço que exige a escolha do profissional", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG13.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG13.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG13.casePrefix)
				.withApprovalMode(bookingAG13.approvalMode)
				.withProfessionalSelectionMode(bookingAG13.selectionMode)
				.build(),
			professionalBuilder.withName(bookingAG13.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG13.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG13.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG13.weekday, bookingAG13.startTime, bookingAG13.endTime)
				.build(),
			adminParams,
		)

		serviceId = bookable.serviceId
		const person = endUsersFor(bookingAG13.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG13.date, bookingAG13.cleanupReason, adminParams)

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG13.loginParams,
		)

		startsAt = (
			await appointmentsBusiness.firstPublicSlot(
				serviceId,
				bookingAG13.date,
				bookingAG13.paramsDefault200(clientParams.token),
			)
		).startsAt
	})

	it(`[AG-13-F]${bugTag(bookingAG13.knownBug)} - Serviço que exige profissional recusa a omissão, na disponibilidade e na criação`, async () => {
		const { json } = await postPublicCreateAppointment(
			{ serviceId, startsAt },
			bookingAG13.paramsDefault400(clientParams.token),
		)

		assertTs.equal(
			json.statusCode,
			400,
			bugMessage(
				"A criação sem profissional em serviço `required` não foi recusada com 400.",
				bookingAG13.knownBug,
			),
		)

		// A especificação estende a exigência à consulta de disponibilidade.
		const availabilityStatus =
			await appointmentsBusiness.publicAvailabilityStatus(
				serviceId,
				bookingAG13.date,
				bookingAG13.paramsDefault200(clientParams.token),
			)

		assertTs.equal(
			availabilityStatus,
			bookingAG13.expectedAvailabilityStatus,
			bugMessage(
				"A consulta de disponibilidade não exigiu a escolha do profissional.",
				bookingAG13.knownBug,
			),
		)
	})
})
