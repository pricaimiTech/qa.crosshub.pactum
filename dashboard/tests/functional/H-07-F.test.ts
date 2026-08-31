import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getHome from "@core/services/dashboard/getHome.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { homeH07 } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Submissão recém-criada, com um conteúdo reconhecível", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			homeH07.loginParams,
		)

		await formsBusiness.cleanupByPrefix(homeH07.casePrefix, adminParams)

		await formsBusiness.createAnsweredSensitiveForm(
			formBuilder.withTitle(homeH07.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(homeH07.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			homeH07.secretAnswer,
			adminParams,
		)
	})

	it("[H-07-F] - O feed da Home traz metadado do formulário, nunca o conteúdo da resposta", async () => {
		const { json } = await getHome(homeH07.paramsDefault200(adminParams.token))

		const submissoes = json.activities.filter(
			(activity: { type: string }) => activity.type === "form_submitted",
		)

		assertTs.isAbove(
			submissoes.length,
			0,
			"O feed não trouxe nenhuma submissão de formulário para conferir.",
		)

		const semMetadado = submissoes.filter(
			(activity: { title: string; description: string; destination: unknown }) =>
				!activity.title || !activity.description || !activity.destination,
		)

		assertTs.deepEqual(
			semMetadado,
			[],
			"Alguma submissão no feed veio sem título, descrição ou destino.",
		)

		assertTs.notInclude(
			JSON.stringify(json.activities),
			homeH07.secretAnswer,
			"O conteúdo da resposta vazou para o feed da Home.",
		)
	})
})
