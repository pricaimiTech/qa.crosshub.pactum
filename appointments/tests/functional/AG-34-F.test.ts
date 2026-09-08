import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	describeName,
	packageBuilder,
	serviceBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import deleteService from "@core/services/appointments/deleteService.service"
import postCreatePackage from "@core/services/appointments/postCreatePackage.service"
import postCreateService from "@core/services/appointments/postCreateService.service"
import { validationsAG34 } from "@appointments-data/validations.data"

/*
 * O serviço coberto pelo pacote e o próprio pacote ficam no tenant: não existe
 * rota para excluir pacote, então a limpeza por prefixo recebe 409 e segue
 * (ver "Massa que não dá para apagar" no CLAUDE.md).
 */
describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let serviceInPackage: string
	let serviceWithoutPackage: string

	before("Um serviço coberto por pacote e outro recém-criado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			validationsAG34.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			validationsAG34.casePrefix,
			adminParams,
		)

		serviceInPackage = (
			await postCreateService(
				serviceBuilder.withName(validationsAG34.casePrefix).build(),
				validationsAG34.paramsDefault201(adminParams.token),
			)
		).json.id

		await postCreatePackage(
			packageBuilder
				.withName(validationsAG34.packageName)
				.withCredits(validationsAG34.priceCents, validationsAG34.totalCredits)
				.withService(serviceInPackage, validationsAG34.creditsPerSession)
				.build(),
			validationsAG34.paramsDefault201(adminParams.token),
		)

		serviceWithoutPackage = (
			await postCreateService(
				serviceBuilder.withName(validationsAG34.casePrefix).build(),
				validationsAG34.paramsDefault201(adminParams.token),
			)
		).json.id
	})

	it("[AG-34-F] - Serviço coberto por pacote não é excluído; fora de pacote, é", async () => {
		const { json } = await deleteService(
			serviceInPackage,
			validationsAG34.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.message,
			validationsAG34.errorMessage,
			"A mensagem da exclusão bloqueada não é a especificada.",
		)

		const removed = await deleteService(
			serviceWithoutPackage,
			validationsAG34.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			removed.json.id,
			serviceWithoutPackage,
			"O serviço fora de pacote não foi excluído.",
		)
	})
})
