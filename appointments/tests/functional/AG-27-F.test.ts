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
import getCalendar from "@core/services/appointments/getCalendar.service"
import { calendarAG27 } from "@appointments-data/calendar.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let serviceId: string

	before("Agenda normal no dia de um feriado nacional, sem bloqueio", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			calendarAG27.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(calendarAG27.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder.withName(calendarAG27.casePrefix).build(),
			professionalBuilder.withName(calendarAG27.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(calendarAG27.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(calendarAG27.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					calendarAG27.holidayWeekday,
					calendarAG27.startTime,
					calendarAG27.endTime,
				)
				.build(),
			adminParams,
		)

		serviceId = bookable.serviceId
	})

	it("[AG-27-F] - Feriado é sinalizado no calendário, mas não bloqueia a agenda", async () => {
		const { json } = await getCalendar(
			{ from: calendarAG27.holidayDate, to: calendarAG27.holidayDate },
			calendarAG27.paramsDefault200(adminParams.token),
		)

		const sinalizado = json.holidays.filter(
			(holiday: { date: string; name: string }) =>
				holiday.date === calendarAG27.holidayDate &&
				holiday.name === calendarAG27.holidayName,
		)

		assertTs.lengthOf(
			sinalizado,
			1,
			"O feriado não aparece no calendário com o nome esperado.",
		)

		const slots = await appointmentsBusiness.adminSlots(
			serviceId,
			calendarAG27.holidayDate,
			calendarAG27.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			slots,
			calendarAG27.expectedSlotCount,
			"O feriado bloqueou a agenda, mas ele é apenas sinalização visual.",
		)
	})
})
