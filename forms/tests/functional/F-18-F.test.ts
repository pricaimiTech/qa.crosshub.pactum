import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getPublicForm from "@core/services/public/getPublicForm.service"
import getPublicMyForms from "@core/services/public/getPublicMyForms.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF18 } from "@forms-data/forms.data"

describe(describeName.public, () => {
	let clientParams: IParamsDefault
	let formId: string

	before("Formulário publicado sem atribuição para a pessoa", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF18.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF18.casePrefix, adminParams)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(formsF18.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			adminParams,
		)

		formId = published.formId

		const person = endUsersFor(formsF18.caseId)[0]

		clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			formsF18.loginParams,
		)
	})

	it(`[F-18-F] - Formulário sem atribuição não aparece para a pessoa nem abre por acesso direto (404: não revela que existe)`, async () => {
		const { json } = await getPublicMyForms(
			formsF18.paramsDefault200(clientParams.token),
		)

		assertTs.notInclude(
			JSON.stringify(json),
			formId,
			"O formulário sem atribuição apareceu na lista do cliente.",
		)

		await getPublicForm(
			formId,
			formsF18.paramsDefault404(clientParams.token),
		)
	})
})
