import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	availabilityBuilder,
	describeName,
	professionalBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getProfessionalAvailability from "@core/services/appointments/getProfessionalAvailability.service"
import postCreateProfessional from "@core/services/appointments/postCreateProfessional.service"
import putSaveProfessionalAvailability from "@core/services/appointments/putSaveProfessionalAvailability.service"
import { availabilityAG05 } from "@appointments-data/availability.data"

describe(describeName.dashboard, () => {
	let authParams: IParamsDefault
	let professionalId: string

	before("Profissional com uma única regra, das 08:00 às 12:00", async () => {
		authParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			availabilityAG05.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			availabilityAG05.casePrefix,
			authParams,
		)

		const professional = await postCreateProfessional(
			professionalBuilder.withName(availabilityAG05.casePrefix).build(),
			availabilityAG05.paramsDefault201(authParams.token),
		)

		professionalId = professional.json.id

		await putSaveProfessionalAvailability(
			professionalId,
			availabilityBuilder
				.reset()
				.withRule(
					availabilityAG05.weekday,
					availabilityAG05.baselineStartTime,
					availabilityAG05.baselineEndTime,
				)
				.build(),
			availabilityAG05.paramsDefault200(authParams.token),
		)
	})

	it("[AG-05-F] - Recusa duas regras que se cruzam no mesmo dia e não persiste nada", async () => {
		await putSaveProfessionalAvailability(
			professionalId,
			availabilityBuilder
				.reset()
				.withRule(
					availabilityAG05.weekday,
					availabilityAG05.baselineStartTime,
					availabilityAG05.baselineEndTime,
				)
				.withRule(
					availabilityAG05.weekday,
					availabilityAG05.overlappingStartTime,
					availabilityAG05.overlappingEndTime,
					"afternoon",
				)
				.build(),
			availabilityAG05.paramsDefault400(authParams.token),
		)

		const { json } = await getProfessionalAvailability(
			professionalId,
			availabilityAG05.paramsDefault200(authParams.token),
		)

		assertTs.lengthOf(
			json,
			availabilityAG05.expectedRuleCount,
			"A gravação não foi atômica: a grade do profissional mudou apesar da recusa.",
		)
	})
})
