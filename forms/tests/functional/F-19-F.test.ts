import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListFormSubmissions from "@core/services/forms/getListFormSubmissions.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { adminFor } from "@core/utils/admin.utils"
import { formsF19 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let restrictedParams: IParamsDefault
	let formId: string

	before("Formulário sensível respondido, e um admin sem permissão", async () => {
		const adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF19.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF19.casePrefix, adminParams)

		const person = endUsersFor(formsF19.caseId)[0]

		const published = await formsBusiness.createAssignedForm(
			formBuilder
				.withTitle(formsF19.casePrefix)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			person.personId,
			adminParams,
		)

		formId = published.formId

		const clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			formsF19.loginParams,
		)

		await formsBusiness.submitTextAnswers(
			formId,
			published.questionIds,
			"Resposta sensível",
			formsF19.paramsDefault201(clientParams.token),
		)

		const restricted = adminFor("F-19")

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			formsF19.loginParams,
		)
	})

	it("[F-19-F] - Admin sem permissão não lê respostas de formulário sensível", async () => {
		const { json } = await getListFormSubmissions(
			formId,
			{},
			formsF19.paramsDefault403(restrictedParams.token),
		)

		assertTs.equal(
			json.message,
			formsF19.errorMessage,
			"A recusa por falta de permissão não trouxe a mensagem especificada.",
		)
	})
})
