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
import { groupsG13 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let groupId: string
	let groupName: string
	let memberIds: Array<string>

	before("Grupo manual com cinco integrantes", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG13.loginParams,
		)

		memberIds = await formsBusiness.createPeople(
			Array.from({ length: groupsG13.initialMemberCount }, () =>
				personBuilder
					.withName(groupsG13.personPrefix)
					.withEmail(groupsG13.personPrefix)
					.build(),
			),
			adminParams,
		)

		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG13.casePrefix)
				.withPeople(memberIds)
				.build(),
			groupsG13.paramsDefault201(adminParams.token),
		)

		groupId = grupos[0].id
		groupName = grupos[0].name
	})

	it("[G-13-F] - A edição substitui a composição inteira e adota a nova ordem", async () => {
		// Os três últimos, na ordem invertida: prova substituição e ordem de uma vez.
		const novaComposicao = memberIds
			.slice(groupsG13.initialMemberCount - groupsG13.finalMemberCount)
			.reverse()

		const { json } = await patchUpdateGroup(
			groupId,
			{ name: groupName, status: "draft", personIds: novaComposicao },
			groupsG13.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.participantCount,
			groupsG13.finalMemberCount,
			"A edição não substituiu a composição — o total continua o anterior.",
		)

		assertTs.deepEqual(
			json.participantIds,
			novaComposicao,
			"A nova ordem enviada na edição não virou a ordem do grupo.",
		)
	})
})
