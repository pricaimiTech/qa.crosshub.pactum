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
import postClose from "@core/services/forms/postClose.service"
import postDuplicate from "@core/services/forms/postDuplicate.service"
import postPublish from "@core/services/forms/postPublish.service"
import { bugTag } from "@core/utils/bug.utils"
import { formsF03 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let questionCount: number

	before("Formulário publicado e depois encerrado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF03.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF03.casePrefix, adminParams)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(formsF03.casePrefix).build(),
			questionsBuilder.reset().withShortText().withSingleChoice().build(),
			adminParams,
		)

		formId = published.formId
		questionCount = published.questionIds.length

		await postClose(formId, formsF03.paramsDefault201(adminParams.token))
	})

	it(`[F-03-F]${bugTag(formsF03.knownBug)} - Formulário encerrado não volta a ser publicado; duplicar gera novo rascunho`, async () => {
		await postPublish(formId, formsF03.paramsDefault400(adminParams.token))

		const duplicated = await postDuplicate(
			formId,
			formsF03.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			duplicated.json.status,
			formsF03.draftStatus,
			"A duplicação não gerou um formulário em rascunho.",
		)

		const questions = await getListQuestions(
			duplicated.json.id,
			formsF03.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			questions.json,
			questionCount,
			"A duplicação não copiou as perguntas do formulário encerrado.",
		)
	})
})
