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
import deleteProfessional from "@core/services/appointments/deleteProfessional.service"
import postCreateProfessional from "@core/services/appointments/postCreateProfessional.service"
import { validationsAG29 } from "@appointments-data/validations.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let professionalWithHistory: string
	let professionalWithoutHistory: string

	before("Um profissional com agendamento e outro recém-criado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			validationsAG29.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			validationsAG29.casePrefix,
			adminParams,
		)

		const scenario = await appointmentsBusiness.createAppointmentScenario(
			serviceBuilder.withName(validationsAG29.casePrefix).build(),
			professionalBuilder.withName(validationsAG29.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(validationsAG29.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(validationsAG29.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					validationsAG29.weekday,
					validationsAG29.startTime,
					validationsAG29.endTime,
				)
				.build(),
			personBuilder
				.withName(validationsAG29.casePrefix)
				.withEmail(validationsAG29.casePrefix)
				.build(),
			validationsAG29.date,
			adminParams,
		)

		professionalWithHistory = scenario.professionalId

		professionalWithoutHistory = (
			await postCreateProfessional(
				professionalBuilder.withName(validationsAG29.casePrefix).build(),
				validationsAG29.paramsDefault201(adminParams.token),
			)
		).json.id
	})

	it("[AG-29-F] - Profissional com agendamento não é excluído; sem histórico, é", async () => {
		const { json } = await deleteProfessional(
			professionalWithHistory,
			validationsAG29.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.message,
			validationsAG29.errorMessage,
			"A mensagem da exclusão bloqueada não é a especificada.",
		)

		const removed = await deleteProfessional(
			professionalWithoutHistory,
			validationsAG29.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			removed.json.id,
			professionalWithoutHistory,
			"O profissional sem histórico não foi excluído.",
		)
	})
})
