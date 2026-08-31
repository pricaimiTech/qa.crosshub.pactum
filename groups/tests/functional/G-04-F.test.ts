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
import postArchive from "@core/services/forms/postArchive.service"
import postUnpublish from "@core/services/forms/postUnpublish.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { groupsG04 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let publishedFormId: string
	let unpublishedFormId: string
	let archivedFormId: string
	let closedFormId: string

	before("Formulários respondidos em quatro estados diferentes", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG04.loginParams,
		)

		await formsBusiness.cleanupByPrefix(groupsG04.casePrefix, adminParams)

		const client = endUsersFor(groupsG04.caseId)[0]

		const publicado = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder.withTitle(groupsG04.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			client,
			`${process.env.TENANT_SLUG}`,
			groupsG04.answer,
			adminParams,
		)

		publishedFormId = publicado.formId

		const fechado = await formsBusiness.createClosedAnsweredForm(
			formBuilder.withTitle(groupsG04.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			client,
			`${process.env.TENANT_SLUG}`,
			groupsG04.answer,
			1,
			adminParams,
		)

		closedFormId = fechado.formId

		// O mesmo formulário publicado, levado a UNPUBLISHED e a ARCHIVED.
		const despublicado = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder.withTitle(groupsG04.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			client,
			`${process.env.TENANT_SLUG}`,
			groupsG04.answer,
			adminParams,
		)

		unpublishedFormId = despublicado.formId

		await postUnpublish(
			unpublishedFormId,
			groupsG04.paramsDefault201(adminParams.token),
		)

		const arquivado = await formsBusiness.createClosedAnsweredForm(
			formBuilder.withTitle(groupsG04.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			client,
			`${process.env.TENANT_SLUG}`,
			groupsG04.answer,
			1,
			adminParams,
		)

		archivedFormId = arquivado.formId

		await postArchive(
			archivedFormId,
			groupsG04.paramsDefault201(adminParams.token),
		)
	})

	it("[G-04-F] - Só formulário encerrado gera grupo; publicado, despublicado e arquivado são recusados", async () => {
		await groupsBusiness.rejectedGroups(
			[
				groupBuilder
					.withName(groupsG04.casePrefix)
					.withForm(publishedFormId)
					.build(),
				groupBuilder
					.withName(groupsG04.casePrefix)
					.withForm(unpublishedFormId)
					.build(),
				groupBuilder
					.withName(groupsG04.casePrefix)
					.withForm(archivedFormId)
					.build(),
			],
			groupsG04.paramsDefault400(adminParams.token),
		)

		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG04.casePrefix)
				.withForm(closedFormId)
				.build(),
			groupsG04.paramsDefault201(adminParams.token),
		)

		assertTs.isAbove(
			grupos.length,
			0,
			"O formulário encerrado, que é o único estado aceito, não gerou grupo.",
		)
	})
})
