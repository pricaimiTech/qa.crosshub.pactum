import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateForm from "@core/services/forms/postCreateForm.service"
import putReplaceQuestions from "@core/services/forms/putReplaceQuestions.service"
import { formsF05 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário em DRAFT, sem perguntas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF05.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF05.casePrefix, adminParams)

		formId = (
			await postCreateForm(
				formBuilder.withTitle(formsF05.casePrefix).build(),
				formsF05.paramsDefault201(adminParams.token),
			)
		).json.id
	})

	it("[F-05-F] - Pergunta de escolha única com uma só opção é recusada", async () => {
		const { json } = await formsBusiness.rejectedQuestions(
			formId,
			[
				{
					type: "SINGLE_CHOICE",
					title: "Escolha com opção única",
					isRequired: false,
					options: [{ label: formsF05.singleOptionLabel }],
				},
			],
			formsF05.paramsDefault400(adminParams.token),
		)

		assertTs.equal(
			json.statusCode,
			400,
			"Uma pergunta de escolha com menos de duas opções foi aceita.",
		)
	})
})
