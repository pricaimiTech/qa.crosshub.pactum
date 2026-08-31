import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import putReplaceQuestions from "@core/services/forms/putReplaceQuestions.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF08 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário publicado que já recebeu uma resposta", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF08.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF08.casePrefix, adminParams)

		const person = endUsersFor(formsF08.caseId)[0]

		const published = await formsBusiness.createAssignedForm(
			formBuilder.withTitle(formsF08.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			person.personId,
			adminParams,
		)

		formId = published.formId

		const clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			formsF08.loginParams,
		)

		await formsBusiness.submitTextAnswers(
			formId,
			published.questionIds,
			formsF08.answer,
			formsF08.paramsDefault201(clientParams.token),
		)
	})

	it("[F-08-F] - Perguntas ficam travadas depois da primeira resposta", async () => {
		const { json } = await putReplaceQuestions(
			formId,
			questionsBuilder.reset().withShortText().withShortText().build(),
			formsF08.paramsDefault400(adminParams.token),
		)

		assertTs.equal(
			json.statusCode,
			400,
			"As perguntas foram trocadas depois de o formulário já ter resposta — as respostas existentes passariam a apontar para pergunta inexistente.",
		)
	})
})
