import {
	assertTs,
	authBusiness,
	describeName,
	formsBusiness,
	groupBuilder,
	groupsBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchUpdateGroup from "@core/services/groups/patchUpdateGroup.service"
import { groupsG10 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let groupId: string
	let groupName: string

	before("Grupo manual com um integrante", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG10.loginParams,
		)

		const people = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(groupsG10.personPrefix)
					.withEmail(groupsG10.personPrefix)
					.build(),
			],
			adminParams,
		)

		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG10.casePrefix)
				.withPeople(people)
				.build(),
			groupsG10.paramsDefault201(adminParams.token),
		)

		groupId = grupos[0].id
		groupName = grupos[0].name
	})

	it("[G-10-F] - Grupo nunca fica sem integrante: esvaziar a composição é recusado", async () => {
		const { json } = await patchUpdateGroup(
			groupId,
			{ name: groupName, status: "draft", personIds: [] },
			groupsG10.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(json.message),
			groupsG10.emptyGroupMessage,
			"Esvaziar o grupo não trouxe a mensagem que garante a invariante.",
		)

		const depois = await groupsBusiness.groupsByPrefix(
			groupsG10.casePrefix,
			adminParams,
		)

		const semIntegrante = depois.filter(
			(grupo) => grupo.participantCount === 0,
		)

		assertTs.deepEqual(
			semIntegrante,
			[],
			"Algum grupo do caso ficou sem integrante — a invariante foi quebrada.",
		)
	})
})
