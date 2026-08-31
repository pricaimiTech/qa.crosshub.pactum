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
import { formsF06 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário em DRAFT, sem perguntas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF06.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF06.casePrefix, adminParams)

		formId = (
			await postCreateForm(
				formBuilder.withTitle(formsF06.casePrefix).build(),
				formsF06.paramsDefault201(adminParams.token),
			)
		).json.id
	})

	it("[F-06-F] - Título de pergunta com 301 caracteres é recusado; com 300, aceito", async () => {
		await putReplaceQuestions(
			formId,
			questionsBuilder.reset().withShortText(formsF06.titleOverLimit).build(),
			formsF06.paramsDefault400(adminParams.token),
		)

		await putReplaceQuestions(
			formId,
			questionsBuilder.reset().withShortText(formsF06.titleAtLimit).build(),
			formsF06.paramsDefault200(adminParams.token),
		)

		const { json } = await getListQuestions(
			formId,
			formsF06.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			json[0].title,
			formsF06.titleAtLimit.length,
			"O título no limite de 300 caracteres não foi gravado inteiro.",
		)
	})
})
