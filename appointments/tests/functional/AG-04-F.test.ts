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
import { timeInTenantTimezone } from "@core/utils/date.utils"
import { calendarAG04 } from "@appointments-data/calendar.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let serviceId: string

	before("Agenda cobrindo o dia inteiro de hoje", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			calendarAG04.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(calendarAG04.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder.withName(calendarAG04.casePrefix).build(),
			professionalBuilder.withName(calendarAG04.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(calendarAG04.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(calendarAG04.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					calendarAG04.weekday,
					calendarAG04.startTime,
					calendarAG04.endTime,
				)
				.build(),
			adminParams,
		)

		serviceId = bookable.serviceId
	})

	it("[AG-04-F] - Janelas que já começaram não aparecem na consulta do dia corrente", async () => {
		const slots = await appointmentsBusiness.adminSlots(
			serviceId,
			calendarAG04.date,
			calendarAG04.paramsDefault200(adminParams.token),
		)

		const agora = timeInTenantTimezone(new Date().toISOString())

		const passadas = slots
			.map((slot) => timeInTenantTimezone(slot.startsAt))
			.filter((horario) => horario < agora)

		assertTs.deepEqual(
			passadas,
			[],
			`A agenda de hoje ainda oferece janelas que já começaram (agora são ${agora}).`,
		)
	})
})
