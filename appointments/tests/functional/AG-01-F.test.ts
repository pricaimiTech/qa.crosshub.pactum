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
import getAvailability from "@core/services/appointments/getAvailability.service"
import { timeInTenantTimezone } from "@core/utils/date.utils"
import { availabilityAG01 } from "@appointments-data/availability.data"

describe(describeName.dashboard, () => {
	let authParams: IParamsDefault
	let serviceId: string

	before("Serviço de 60 min, sem intervalo, com agenda das 08:00 às 12:00", async () => {
		authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			availabilityAG01.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			availabilityAG01.casePrefix,
			authParams,
		)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder.withName(availabilityAG01.casePrefix).build(),
			professionalBuilder.withName(availabilityAG01.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(availabilityAG01.durationMinutes)
				.withIntervalMinutes(availabilityAG01.intervalMinutes)
				.withCapacity(availabilityAG01.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					availabilityAG01.weekday,
					availabilityAG01.startTime,
					availabilityAG01.endTime,
				)
				.build(),
			authParams,
		)

		serviceId = bookable.serviceId
	})

	it("[AG-01-F] - Gera exatamente quatro janelas de uma hora entre 08:00 e 12:00", async () => {
		const { json } = await getAvailability(
			{ serviceId, date: availabilityAG01.date },
			availabilityAG01.paramsDefault200(authParams.token),
		)

		const slots: Array<string> = json.slots.map((slot: { startsAt: string }) =>
			timeInTenantTimezone(slot.startsAt),
		)

		assertTs.deepEqual(
			slots,
			availabilityAG01.expectedSlots,
			"As janelas geradas não são exatamente 08:00, 09:00, 10:00 e 11:00.",
		)
	})
})
