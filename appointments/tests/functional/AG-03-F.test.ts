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
import { availabilityAG03 } from "@appointments-data/availability.data"

describe(describeName.dashboard, () => {
	let authParams: IParamsDefault
	let serviceId: string

	before("Serviço de 90 min com turno de uma hora, das 08:00 às 09:00", async () => {
		authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			availabilityAG03.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			availabilityAG03.casePrefix,
			authParams,
		)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder.withName(availabilityAG03.casePrefix).build(),
			professionalBuilder.withName(availabilityAG03.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(availabilityAG03.durationMinutes)
				.withIntervalMinutes(availabilityAG03.intervalMinutes)
				.withCapacity(availabilityAG03.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					availabilityAG03.weekday,
					availabilityAG03.startTime,
					availabilityAG03.endTime,
				)
				.build(),
			authParams,
		)

		serviceId = bookable.serviceId
	})

	it("[AG-03-F] - Não gera janela quando o atendimento não cabe no turno", async () => {
		const { json } = await getAvailability(
			{ serviceId, date: availabilityAG03.date },
			availabilityAG03.paramsDefault200(authParams.token),
		)

		const slots: Array<string> = json.map((slot: { startsAt: string }) =>
			timeInTenantTimezone(slot.startsAt),
		)

		assertTs.deepEqual(
			slots,
			availabilityAG03.expectedSlots,
			"Uma janela foi gerada apesar de o atendimento de 90 min não caber no turno de 60 min.",
		)
	})
})
