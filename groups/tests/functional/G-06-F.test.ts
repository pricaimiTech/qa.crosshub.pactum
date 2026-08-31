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
import postClose from "@core/services/forms/postClose.service"
import { groupsG06 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário encerrado sem nenhuma resposta", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG06.loginParams,
		)

		await formsBusiness.cleanupByPrefix(groupsG06.casePrefix, adminParams)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(groupsG06.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			adminParams,
		)

		formId = published.formId

		await postClose(formId, groupsG06.paramsDefault201(adminParams.token))
	})

	it("[G-06-F] - Formulário encerrado sem respondente não gera grupo", async () => {
		await groupsBusiness.rejectedGroups(
			[groupBuilder.withName(groupsG06.casePrefix).withForm(formId).build()],
			groupsG06.paramsDefault400(adminParams.token),
		)

		const criados = await groupsBusiness.groupsByPrefix(
			groupsG06.casePrefix,
			adminParams,
		)

		assertTs.lengthOf(
			criados,
			0,
			"Um grupo vazio foi criado a partir de formulário sem respondente.",
		)
	})
})
