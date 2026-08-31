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
import patchUpdateGroup from "@core/services/groups/patchUpdateGroup.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { groupsG12 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let groupId: string
	let groupName: string
	let personId: string

	before("Grupo gerado a partir de formulário encerrado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG12.loginParams,
		)

		await formsBusiness.cleanupByPrefix(groupsG12.casePrefix, adminParams)

		const closed = await formsBusiness.createClosedAnsweredForm(
			formBuilder.withTitle(groupsG12.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(groupsG12.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			groupsG12.answer,
			1,
			adminParams,
		)

		personId = closed.personId

		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG12.casePrefix)
				.withForm(closed.formId)
				.build(),
			groupsG12.paramsDefault201(adminParams.token),
		)

		groupId = grupos[0].id
		groupName = grupos[0].name
	})

	it("[G-12-F] - Grupo de formulário recusa troca de integrantes, mas aceita edição dos demais campos", async () => {
		await patchUpdateGroup(
			groupId,
			{ name: groupName, status: "draft", personIds: [personId] },
			groupsG12.paramsDefault400(adminParams.token),
		)

		const { json } = await patchUpdateGroup(
			groupId,
			{ name: groupsG12.newName, status: "draft" },
			groupsG12.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.name,
			groupsG12.newName,
			"O nome de um grupo de formulário não pôde ser editado, mas deveria.",
		)
	})
})
