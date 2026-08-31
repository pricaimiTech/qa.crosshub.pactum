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
import { bookingAG12 } from "@appointments-data/booking.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let serviceId: string
	let professionalId: string
	let startsAt: string

	before("Serviço com escolha de profissional automática", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG12.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG12.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder
				.withName(bookingAG12.casePrefix)
				.withApprovalMode(bookingAG12.approvalMode)
				.withProfessionalSelectionMode(bookingAG12.selectionMode)
				.build(),
			professionalBuilder.withName(bookingAG12.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG12.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG12.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(bookingAG12.weekday, bookingAG12.startTime, bookingAG12.endTime)
				.build(),
			adminParams,
		)

		serviceId = bookable.serviceId
		professionalId = bookable.professionalId

		const person = endUsersFor(bookingAG12.caseId)[0]

		await appointmentsBusiness.cancelAllAppointmentsOnDate(bookingAG12.date, bookingAG12.cleanupReason, adminParams)

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			bookingAG12.loginParams,
		)

		startsAt = (
			await appointmentsBusiness.firstPublicSlot(
				serviceId,
				bookingAG12.date,
				bookingAG12.paramsDefault200(clientParams.token),
			)
		).startsAt
	})

	it(`[AG-12-F]${bugTag(bookingAG12.knownBug)} - Serviço de escolha automática rejeita o profissional escolhido pelo cliente`, async () => {
		const { json } = await postPublicCreateAppointment(
			{ serviceId, startsAt, professionalId },
			bookingAG12.paramsDefault400(clientParams.token),
		)

		assertTs.equal(
			json.statusCode,
			400,
			bugMessage(
				"A recusa da escolha explícita de profissional não veio como 400.",
				bookingAG12.knownBug,
			),
		)
	})
})
