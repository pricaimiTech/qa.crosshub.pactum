import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postArchive from "@core/services/forms/postArchive.service"
import postClose from "@core/services/forms/postClose.service"
import postCreateForm from "@core/services/forms/postCreateForm.service"
import postPublish from "@core/services/forms/postPublish.service"
import postUnpublish from "@core/services/forms/postUnpublish.service"
import putReplaceQuestions from "@core/services/forms/putReplaceQuestions.service"
import { formsF02 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário em DRAFT com uma pergunta", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF02.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF02.casePrefix, adminParams)

		formId = (
			await postCreateForm(
				formBuilder.withTitle(formsF02.casePrefix).build(),
				formsF02.paramsDefault201(adminParams.token),
			)
		).json.id

		await putReplaceQuestions(
			formId,
			questionsBuilder.reset().withShortText().build(),
			formsF02.paramsDefault200(adminParams.token),
		)
	})

	it("[F-02-F] - Ciclo DRAFT → PUBLISHED → UNPUBLISHED → PUBLISHED → CLOSED → ARCHIVED", async () => {
		const published = await postPublish(
			formId,
			formsF02.paramsDefault201(adminParams.token),
		)
		const unpublished = await postUnpublish(
			formId,
			formsF02.paramsDefault201(adminParams.token),
		)
		const republished = await postPublish(
			formId,
			formsF02.paramsDefault201(adminParams.token),
		)
		const closed = await postClose(
			formId,
			formsF02.paramsDefault201(adminParams.token),
		)
		const archived = await postArchive(
			formId,
			formsF02.paramsDefault201(adminParams.token),
		)

		assertTs.deepEqual(
			[
				published.json.status,
				unpublished.json.status,
				republished.json.status,
				closed.json.status,
				archived.json.status,
			],
			formsF02.expectedCycle,
			"O ciclo de estados do formulário não seguiu a sequência especificada.",
		)
	})
})
