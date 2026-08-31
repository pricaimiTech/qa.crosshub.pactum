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
import { availabilityAG02 } from "@appointments-data/availability.data"

describe(describeName.dashboard, () => {
	let authParams: IParamsDefault
	let serviceId: string

	before("Serviço de 60 min, intervalo de 5 min, com agenda das 07:00 às 12:00", async () => {
		authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			availabilityAG02.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			availabilityAG02.casePrefix,
			authParams,
		)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder.withName(availabilityAG02.casePrefix).build(),
			professionalBuilder.withName(availabilityAG02.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(availabilityAG02.durationMinutes)
				.withIntervalMinutes(availabilityAG02.intervalMinutes)
				.withCapacity(availabilityAG02.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					availabilityAG02.weekday,
					availabilityAG02.startTime,
					availabilityAG02.endTime,
				)
				.build(),
			authParams,
		)

		serviceId = bookable.serviceId
	})

	it("[AG-02-F] - O intervalo entra no passo do cursor, não na checagem de cabimento", async () => {
		const { json } = await getAvailability(
			{ serviceId, date: availabilityAG02.date },
			availabilityAG02.paramsDefault200(authParams.token),
		)

		const slots: Array<string> = json.map((slot: { startsAt: string }) =>
			timeInTenantTimezone(slot.startsAt),
		)

		assertTs.deepEqual(
			slots,
			availabilityAG02.expectedSlots,
			"As janelas geradas não são exatamente 07:00, 08:05, 09:10 e 10:15 — a de 11:20 terminaria depois das 12:00 e não pode existir.",
		)
	})
})
