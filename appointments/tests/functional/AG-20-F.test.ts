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
import patchUpdateAppointmentStatus from "@core/services/appointments/patchUpdateAppointmentStatus.service"
import putSaveSettings from "@core/services/appointments/putSaveSettings.service"
import { bookingAG20 } from "@appointments-data/booking.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let appointmentId: string

	before("Agendamento que começa em duas horas — dentro do prazo do cliente", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			bookingAG20.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(bookingAG20.casePrefix, adminParams)

		await putSaveSettings(
			{
				timezone: bookingAG20.timezone,
				cancellationNoticeHours: bookingAG20.cancellationNoticeHours,
				restoreCreditOnLateCancellation: false,
				restoreCreditOnNoShow: false,
				restoreCreditOnAdminCancellation: true,
			},
			bookingAG20.paramsDefault200(adminParams.token),
		)

		const scenario = await appointmentsBusiness.createAppointmentScenario(
			serviceBuilder
				.withName(bookingAG20.casePrefix)
				.withApprovalMode(bookingAG20.approvalMode)
				.build(),
			professionalBuilder.withName(bookingAG20.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(bookingAG20.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(bookingAG20.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					bookingAG20.imminentWindow.weekday,
					bookingAG20.imminentWindow.startTime,
					bookingAG20.imminentWindow.endTime,
				)
				.build(),
			personBuilder
				.withName(bookingAG20.casePrefix)
				.withEmail(bookingAG20.casePrefix)
				.build(),
			bookingAG20.imminentWindow.date,
			adminParams,
		)

		appointmentId = scenario.appointmentId
	})

	it("[AG-20-F] - Admin cancela agendamento que começa em duas horas, apesar do prazo de 24 h", async () => {
		const { json } = await patchUpdateAppointmentStatus(
			appointmentId,
			{ status: "cancelled_by_admin", reason: bookingAG20.cancelReason },
			bookingAG20.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.status,
			bookingAG20.expectedStatus,
			"O prazo de 24 h barrou o admin, mas ele restringe só o cliente.",
		)
	})
})
