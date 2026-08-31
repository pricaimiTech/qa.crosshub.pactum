import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	groupBuilder,
	groupsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { endUsersFor } from "@core/utils/endUser.utils"
import { groupsG05 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let personId: string

	before("Formulário MULTIPLE encerrado, com três respostas da mesma pessoa", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG05.loginParams,
		)

		await formsBusiness.cleanupByPrefix(groupsG05.casePrefix, adminParams)

		const closed = await formsBusiness.createClosedAnsweredForm(
			formBuilder
				.withTitle(groupsG05.casePrefix)
				.withSubmissionMode(groupsG05.submissionMode)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(groupsG05.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			groupsG05.answer,
			groupsG05.submissionCount,
			adminParams,
		)

		formId = closed.formId
		personId = closed.personId
	})

	it("[G-05-F] - Quem respondeu três vezes entra uma vez só no grupo", async () => {
		const grupos = await groupsBusiness.createGroups(
			groupBuilder.withName(groupsG05.casePrefix).withForm(formId).build(),
			groupsG05.paramsDefault201(adminParams.token),
		)

		const doRespondente = grupos[0].participantIds.filter(
			(id) => id === personId,
		)

		assertTs.lengthOf(
			doRespondente,
			groupsG05.expectedParticipants,
			"A pessoa que respondeu três vezes entrou mais de uma vez no grupo.",
		)
	})
})
