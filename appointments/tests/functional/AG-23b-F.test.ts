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
import { validationsAG23b } from "@appointments-data/validations.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let appointmentId: string

	before("Agendamento criado pelo admin", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			validationsAG23b.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			validationsAG23b.casePrefix,
			adminParams,
		)

		const scenario = await appointmentsBusiness.createAppointmentScenario(
			serviceBuilder.withName(validationsAG23b.casePrefix).build(),
			professionalBuilder.withName(validationsAG23b.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(validationsAG23b.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(validationsAG23b.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					validationsAG23b.weekday,
					validationsAG23b.startTime,
					validationsAG23b.endTime,
				)
				.build(),
			personBuilder
				.withName(validationsAG23b.casePrefix)
				.withEmail(validationsAG23b.casePrefix)
				.build(),
			validationsAG23b.date,
			adminParams,
		)

		appointmentId = scenario.appointmentId
	})

	it("[AG-23b-F] - Status não atribuível pelo admin e cancelamento sem motivo são recusados", async () => {
		const statusInvalido = await appointmentsBusiness.rejectedStatusChange(
			appointmentId,
			validationsAG23b.notAssignableStatus,
			undefined,
			validationsAG23b.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			statusInvalido,
			validationsAG23b.invalidStatusMessage,
			"A mensagem do status não atribuível não é a especificada.",
		)

		const semMotivo = await appointmentsBusiness.rejectedStatusChange(
			appointmentId,
			validationsAG23b.missingReasonStatus,
			undefined,
			validationsAG23b.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			semMotivo,
			validationsAG23b.missingReasonMessage,
			"A mensagem do motivo obrigatório não é a especificada.",
		)
	})
})
