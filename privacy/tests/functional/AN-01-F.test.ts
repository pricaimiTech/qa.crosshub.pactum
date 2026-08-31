import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postAnonymizationRequest from "@core/services/privacy/postAnonymizationRequest.service"
import { anonymizationAN01 } from "@privacy-data/anonymization.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string

	before("Uma pessoa cadastrada, alvo das rotas candidatas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			anonymizationAN01.loginParams,
		)

		const created = await peopleBusiness.createPersonWithCode(
			personBuilder
				.withName(anonymizationAN01.casePrefix)
				.withEmail(anonymizationAN01.casePrefix)
				.build(),
			adminParams,
		)

		personId = created.personId
	})

	it("[AN-01-F] - Anonimizar e apagar pessoa continuam não existindo na API", async () => {
		const status = await Promise.all(
			anonymizationAN01.absentRoutes.map(async (rota) => {
				const resposta = await postAnonymizationRequest(
					rota.method.toLowerCase() as "post" | "delete",
					rota.path.replace("{personId}", personId),
					anonymizationAN01.paramsDefault404(adminParams.token),
				)

				return resposta.statusCode
			}),
		)

		assertTs.deepEqual(
			status,
			anonymizationAN01.absentRoutes.map(() => 404),
			"Alguma rota de anonimização ou exclusão física passou a existir. São operações irreversíveis: se a entrada for intencional, o caso precisa ser reescrito com trilha e confirmação; se não for, é exposição acidental.",
		)
	})
})
