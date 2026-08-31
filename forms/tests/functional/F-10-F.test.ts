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
import { formsF10 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let latecomerId: string

	before("Formulário publicado para todos os ativos e uma pessoa criada depois", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF10.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF10.casePrefix, adminParams)

		await formsBusiness.createPeople(
			Array.from({ length: formsF10.peopleBeforePublish }, () =>
				personBuilder
					.withName(formsF10.personPrefix)
					.withEmail(formsF10.personPrefix)
					.build(),
			),
			adminParams,
		)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(formsF10.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			adminParams,
		)

		formId = published.formId

		await postPublishToAllActive(
			formId,
			formsF10.paramsDefault201(adminParams.token),
		)

		// A pessoa nasce ativa só depois da publicação.
		const latecomers = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(formsF10.personPrefix)
					.withEmail(formsF10.personPrefix)
					.build(),
			],
			adminParams,
		)

		latecomerId = latecomers[0]
	})

	it("[F-10-F] - Pessoa ativada depois da publicação não entra na audiência", async () => {
		const { json } = await getListFormAssignments(
			formId,
			formsF10.paramsDefault200(adminParams.token),
		)

		const atribuicaoTardia = json.assignments.filter(
			(assignment: { personId: string }) => assignment.personId === latecomerId,
		)

		assertTs.lengthOf(
			atribuicaoTardia,
			0,
			"A pessoa criada depois da publicação recebeu atribuição — a audiência virou dinâmica.",
		)
	})
})
