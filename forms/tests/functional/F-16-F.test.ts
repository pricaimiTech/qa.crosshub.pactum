import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListAllSubmissions from "@core/services/forms/getListAllSubmissions.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF16 } from "@forms-data/forms.data"

describe(describeName.public, () => {
	let adminParams: IParamsDefault
	let clientParams: IParamsDefault
	let formId: string
	let questionIds: Array<string>
	let personId: string

	before("Formulário MULTIPLE atribuído à pessoa", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF16.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF16.casePrefix, adminParams)

		const person = endUsersFor(formsF16.caseId)[0]
		personId = person.personId

		const published = await formsBusiness.createAssignedForm(
			formBuilder
				.withTitle(formsF16.casePrefix)
				.withSubmissionMode(formsF16.submissionMode)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			personId,
			adminParams,
		)

		formId = published.formId
		questionIds = published.questionIds

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			formsF16.loginParams,
		)

		await formsBusiness.submitTextAnswers(
			formId,
			questionIds,
			formsF16.firstAnswer,
			formsF16.paramsDefault201(clientParams.token),
		)
	})

	it("[F-16-F] - Formulário MULTIPLE aceita a segunda resposta da mesma pessoa", async () => {
		await formsBusiness.submitTextAnswers(
			formId,
			questionIds,
			formsF16.secondAnswer,
			formsF16.paramsDefault201(clientParams.token),
		)

		const { json } = await getListAllSubmissions(
			{ personId },
			formsF16.paramsDefault200(adminParams.token),
		)

		const doFormulario = json.items.filter(
			(item: { formId: string }) => item.formId === formId,
		)

		assertTs.lengthOf(
			doFormulario,
			formsF16.expectedSubmissions,
			"As duas respostas não foram registradas em formulário MULTIPLE.",
		)
	})
})
