import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateForm from "@core/services/forms/postCreateForm.service"
import postPublish from "@core/services/forms/postPublish.service"
import { formsF01 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário em DRAFT, sem nenhuma pergunta", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF01.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF01.casePrefix, adminParams)

		formId = (
			await postCreateForm(
				formBuilder.withTitle(formsF01.casePrefix).build(),
				formsF01.paramsDefault201(adminParams.token),
			)
		).json.id
	})

	it("[F-01-F] - Formulário sem pergunta não pode ser publicado", async () => {
		const { json } = await postPublish(
			formId,
			formsF01.paramsDefault400(adminParams.token),
		)

		assertTs.equal(
			json.statusCode,
			400,
			"Um formulário sem nenhuma pergunta foi publicado.",
		)
	})
})
