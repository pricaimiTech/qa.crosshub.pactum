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
import postPublishToAllActive from "@core/services/forms/postPublishToAllActive.service"
import { formsF09 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let createdPeopleIds: Array<string>

	before("Cinco pessoas ativas e um formulário com perguntas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF09.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF09.casePrefix, adminParams)

		createdPeopleIds = await formsBusiness.createPeople(
			Array.from({ length: formsF09.activePeopleCount }, () =>
				personBuilder
					.withName(formsF09.personPrefix)
					.withEmail(formsF09.personPrefix)
					.build(),
			),
			adminParams,
		)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(formsF09.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			adminParams,
		)

		formId = published.formId
	})

	it("[F-09-F] - Publicar para todos os ativos atribui a cada pessoa ativa, de uma vez", async () => {
		const { json } = await postPublishToAllActive(
			formId,
			formsF09.paramsDefault201(adminParams.token),
		)

		assertTs.isAtLeast(
			json.totalActivePeople,
			formsF09.activePeopleCount,
			"O total de pessoas ativas não cobre as cinco criadas para o caso.",
		)

		const assignments = await getListFormAssignments(
			formId,
			formsF09.paramsDefault200(adminParams.token),
		)

		const atribuidas = assignments.json.assignments.filter(
			(assignment: { personId: string }) =>
				createdPeopleIds.includes(assignment.personId),
		)

		assertTs.lengthOf(
			atribuidas,
			formsF09.activePeopleCount,
			"Nem todas as pessoas ativas do caso receberam atribuição.",
		)
	})
})
