import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postClose from "@core/services/forms/postClose.service"
import postCreateForm from "@core/services/forms/postCreateForm.service"
import postPublish from "@core/services/forms/postPublish.service"
import putReplaceQuestions from "@core/services/forms/putReplaceQuestions.service"
import { formsF04 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário em DRAFT com uma pergunta", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF04.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF04.casePrefix, adminParams)

		formId = (
			await postCreateForm(
				formBuilder.withTitle(formsF04.casePrefix).build(),
				formsF04.paramsDefault201(adminParams.token),
			)
		).json.id

		await putReplaceQuestions(
			formId,
			questionsBuilder.reset().withShortText().build(),
			formsF04.paramsDefault200(adminParams.token),
		)
	})

	it("[F-04-F] - Encerrar é recusado em rascunho e aceito depois de publicado", async () => {
		await postClose(
			formId,
			formsF04.paramsDefaultStatus(
				formsF04.draftCloseStatus,
				adminParams.token,
			),
		)

		await postPublish(formId, formsF04.paramsDefault201(adminParams.token))

		const { json } = await postClose(
			formId,
			formsF04.paramsDefault201(adminParams.token),
		)

		assertTs.exists(
			json.closedAt,
			"O encerramento não registrou `closedAt` no formulário publicado.",
		)
	})
})
