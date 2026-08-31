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
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF12 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let respondentId: string
	let silentId: string

	before("Duas pessoas com o formulário atribuído; só uma responde", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF12.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF12.casePrefix, adminParams)

		const respondent = endUsersFor(formsF12.caseId)[0]
		respondentId = respondent.personId

		const published = await formsBusiness.createAssignedForm(
			formBuilder.withTitle(formsF12.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			respondentId,
			adminParams,
		)

		formId = published.formId

		const silent = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(formsF12.personPrefix)
					.withEmail(formsF12.personPrefix)
					.build(),
			],
			adminParams,
		)

		silentId = silent[0]

		await postAssignForm(
			formId,
			{ personIds: [silentId] },
			formsF12.paramsDefault201(adminParams.token),
		)

		const clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			respondent.email,
			respondent.password,
			formsF12.loginParams,
		)

		await formsBusiness.submitTextAnswers(
			formId,
			published.questionIds,
			formsF12.answer,
			formsF12.paramsDefault201(clientParams.token),
		)
	})

	it("[F-12-F] - A atribuição de quem respondeu fica COMPLETED; a de quem não respondeu, AVAILABLE", async () => {
		const { json } = await getListFormAssignments(
			formId,
			formsF12.paramsDefault200(adminParams.token),
		)

		const respondeu = json.assignments.filter(
			(assignment: { personId: string }) => assignment.personId === respondentId,
		)[0]
		const naoRespondeu = json.assignments.filter(
			(assignment: { personId: string }) => assignment.personId === silentId,
		)[0]

		assertTs.equal(
			respondeu.status,
			formsF12.completedStatus,
			"A atribuição de quem respondeu não ficou COMPLETED.",
		)

		assertTs.equal(
			naoRespondeu.status,
			formsF12.availableStatus,
			"A atribuição de quem não respondeu não está AVAILABLE.",
		)
	})
})
