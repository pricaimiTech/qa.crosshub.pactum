import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	describeName,
	professionalBuilder,
	serviceBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateProfessional from "@core/services/appointments/postCreateProfessional.service"
import postCreateService from "@core/services/appointments/postCreateService.service"
import putSetProfessionals from "@core/services/appointments/putSetProfessionals.service"
import { validationsAG06 } from "@appointments-data/validations.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let serviceId: string
	let professionalId: string

	before("Serviço e profissional criados, ainda sem vínculo", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			validationsAG06.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			validationsAG06.casePrefix,
			adminParams,
		)

		professionalId = (
			await postCreateProfessional(
				professionalBuilder.withName(validationsAG06.casePrefix).build(),
				validationsAG06.paramsDefault201(adminParams.token),
			)
		).json.id

		serviceId = (
			await postCreateService(
				serviceBuilder.withName(validationsAG06.casePrefix).build(),
				validationsAG06.paramsDefault201(adminParams.token),
			)
		).json.id
	})

	it("[AG-06-F] - Vínculo com duração, intervalo, capacidade ou preço fora do mínimo é recusado", async () => {
		const messages = await appointmentsBusiness.rejectedProfessionalLinks(
			serviceId,
			[
				{
					professionalId,
					durationMinutes: validationsAG06.invalidDuration,
					intervalMinutes: 0,
					capacity: 1,
				},
				{
					professionalId,
					durationMinutes: validationsAG06.durationMinutes,
					intervalMinutes: validationsAG06.invalidInterval,
					capacity: 1,
				},
				{
					professionalId,
					durationMinutes: validationsAG06.durationMinutes,
					intervalMinutes: 0,
					capacity: validationsAG06.invalidCapacity,
				},
				{
					professionalId,
					durationMinutes: validationsAG06.durationMinutes,
					intervalMinutes: 0,
					capacity: 1,
					unitPriceCents: validationsAG06.invalidUnitPrice,
				},
			],
			validationsAG06.paramsDefault400(adminParams.token),
		)

		// A API prefixa o caminho do campo (`professionals.0.`), então a
		// asserção é por conteúdo: a estratégia pede a mensagem **em** `message`.
		const semMensagem = messages.filter(
			(message) => !message.includes(validationsAG06.errorMessage),
		)

		assertTs.deepEqual(
			semMensagem,
			[],
			"Alguma das quatro variações inválidas não foi recusada com a mensagem esperada.",
		)
	})
})
