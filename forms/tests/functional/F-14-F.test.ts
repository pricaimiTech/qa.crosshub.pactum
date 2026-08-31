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
import postCreateGroup from "@core/services/groups/postCreateGroup.service"
import { formsF14 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let memberIds: Array<string>

	before("Grupo com três integrantes e um formulário publicado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF14.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF14.casePrefix, adminParams)

		memberIds = await formsBusiness.createPeople(
			Array.from({ length: formsF14.memberCount }, () =>
				personBuilder
					.withName(formsF14.personPrefix)
					.withEmail(formsF14.personPrefix)
					.build(),
			),
			adminParams,
		)

		await postCreateGroup(
			{
				name: formsF14.groupName,
				origin: "people",
				personIds: memberIds,
				creationMode: "manual",
			},
			formsF14.paramsDefault201(adminParams.token),
		)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(formsF14.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			adminParams,
		)

		formId = published.formId
	})

	it("[F-14-F] - Envio por grupo cria uma atribuição por integrante, com origem e rótulo", async () => {
		await postAssignForm(
			formId,
			{
				personIds: memberIds,
				sourceType: formsF14.sourceType,
				sourceLabel: formsF14.sourceLabel,
			},
			formsF14.paramsDefault201(adminParams.token),
		)

		const { json } = await getListFormAssignments(
			formId,
			formsF14.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			json.assignments,
			formsF14.memberCount,
			"O envio por grupo não criou uma atribuição por integrante.",
		)

		const foraDoPadrao = json.assignments.filter(
			(assignment: { sourceType: string; sourceLabel: string }) =>
				assignment.sourceType !== formsF14.sourceType ||
				assignment.sourceLabel !== formsF14.sourceLabel,
		)

		assertTs.lengthOf(
			foraDoPadrao,
			0,
			"Alguma atribuição do grupo não veio com `sourceType: GROUP` e o rótulo enviado.",
		)
	})
})
