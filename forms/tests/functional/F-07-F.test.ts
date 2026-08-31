import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListQuestions from "@core/services/forms/getListQuestions.service"
import postCreateForm from "@core/services/forms/postCreateForm.service"
import putReplaceQuestions from "@core/services/forms/putReplaceQuestions.service"
import { formsF07 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário com três perguntas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF07.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF07.casePrefix, adminParams)

		formId = (
			await postCreateForm(
				formBuilder.withTitle(formsF07.casePrefix).build(),
				formsF07.paramsDefault201(adminParams.token),
			)
		).json.id

		await putReplaceQuestions(
			formId,
			questionsBuilder
				.reset()
				.withShortTexts(formsF07.initialQuestionCount)
				.build(),
			formsF07.paramsDefault200(adminParams.token),
		)
	})

	it("[F-07-F] - PUT de perguntas substitui o conjunto inteiro, não faz merge", async () => {
		await putReplaceQuestions(
			formId,
			questionsBuilder
				.reset()
				.withShortText(formsF07.remainingTitle)
				.build(),
			formsF07.paramsDefault200(adminParams.token),
		)

		const { json } = await getListQuestions(
			formId,
			formsF07.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			json,
			formsF07.finalQuestionCount,
			"As perguntas anteriores não foram removidas — o PUT fez merge em vez de substituir.",
		)

		assertTs.equal(
			json[0].title,
			formsF07.remainingTitle,
			"A pergunta que sobrou não é a enviada no último PUT.",
		)
	})
})
