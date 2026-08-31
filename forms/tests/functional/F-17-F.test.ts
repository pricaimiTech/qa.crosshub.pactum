import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postPublicSubmitForm from "@core/services/public/postPublicSubmitForm.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF17 } from "@forms-data/forms.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let formId: string
	let questionIds: Array<string>

	before("Formulário com pergunta obrigatória, atribuído à pessoa", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF17.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF17.casePrefix, adminParams)

		const person = endUsersFor(formsF17.caseId)[0]

		const published = await formsBusiness.createAssignedForm(
			formBuilder.withTitle(formsF17.casePrefix).build(),
			questionsBuilder
				.reset()
				.withShortText("Pergunta obrigatória", true)
				.build(),
			person.personId,
			adminParams,
		)

		formId = published.formId
		questionIds = published.questionIds

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			formsF17.loginParams,
		)
	})

	it("[F-17-F] - Submissão sem a pergunta obrigatória, ou com a mesma pergunta duas vezes, é recusada", async () => {
		const semObrigatoria = await postPublicSubmitForm(
			formId,
			{ answers: [] },
			formsF17.paramsDefault400(clientParams.token),
		)

		assertTs.equal(
			semObrigatoria.json.statusCode,
			400,
			"A submissão sem a pergunta obrigatória foi aceita.",
		)

		const duplicada = await postPublicSubmitForm(
			formId,
			{
				answers: [
					{ questionId: questionIds[0], textValue: formsF17.answer },
					{ questionId: questionIds[0], textValue: formsF17.answer },
				],
			},
			formsF17.paramsDefault400(clientParams.token),
		)

		assertTs.equal(
			duplicada.json.statusCode,
			400,
			"A submissão com a mesma pergunta repetida em `answers` foi aceita.",
		)
	})
})
