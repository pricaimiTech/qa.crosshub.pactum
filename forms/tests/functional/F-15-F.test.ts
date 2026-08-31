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
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF15 } from "@forms-data/forms.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let formId: string
	let questionIds: Array<string>

	before("Formulário ONCE_PER_PERSON já respondido uma vez pela pessoa", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF15.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF15.casePrefix, adminParams)

		const person = endUsersFor(formsF15.caseId)[0]

		const published = await formsBusiness.createAssignedForm(
			formBuilder
				.withTitle(formsF15.casePrefix)
				.withSubmissionMode(formsF15.submissionMode)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			person.personId,
			adminParams,
		)

		formId = published.formId
		questionIds = published.questionIds

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			formsF15.loginParams,
		)

		await formsBusiness.submitTextAnswers(
			formId,
			questionIds,
			formsF15.answer,
			formsF15.paramsDefault201(clientParams.token),
		)
	})

	it(`[F-15-F]${bugTag(formsF15.knownBug)} - Formulário de resposta única recusa a segunda submissão da mesma pessoa`, async () => {
		const { json } = await postPublicSubmitForm(
			formId,
			{
				answers: questionIds.map((questionId) => ({
					questionId,
					textValue: formsF15.secondAnswer,
				})),
			},
			formsF15.paramsDefault409(clientParams.token),
		)

		assertTs.equal(
			json.statusCode,
			409,
			bugMessage(
				"A segunda resposta em formulário ONCE_PER_PERSON não foi recusada com 409.",
				formsF15.knownBug,
			),
		)
	})
})
