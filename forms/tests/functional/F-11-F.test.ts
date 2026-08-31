import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	personBuilder,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListFormAssignments from "@core/services/forms/getListFormAssignments.service"
import postAssignForm from "@core/services/forms/postAssignForm.service"
import { formsF11 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let personId: string

	before("Formulário publicado com uma atribuição já criada", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF11.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF11.casePrefix, adminParams)

		const people = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(formsF11.personPrefix)
					.withEmail(formsF11.personPrefix)
					.build(),
			],
			adminParams,
		)

		personId = people[0]

		const published = await formsBusiness.createAssignedForm(
			formBuilder.withTitle(formsF11.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			personId,
			adminParams,
		)

		formId = published.formId
	})

	it("[F-11-F] - Reenviar o formulário para a mesma pessoa não duplica a atribuição", async () => {
		await postAssignForm(
			formId,
			{ personIds: [personId] },
			formsF11.paramsDefault201(adminParams.token),
		)

		const { json } = await getListFormAssignments(
			formId,
			formsF11.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			json.assignments,
			formsF11.expectedAssignments,
			"O reenvio criou uma segunda atribuição para a mesma pessoa.",
		)
	})
})
