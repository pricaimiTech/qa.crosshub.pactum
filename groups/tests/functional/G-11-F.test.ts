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
import postActivateGroup from "@core/services/groups/postActivateGroup.service"
import { groupsG11 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let groupId: string

	before("Grupo em rascunho com um integrante", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG11.loginParams,
		)

		const people = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(groupsG11.personPrefix)
					.withEmail(groupsG11.personPrefix)
					.build(),
			],
			adminParams,
		)

		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG11.casePrefix)
				.withPeople(people)
				.build(),
			groupsG11.paramsDefault201(adminParams.token),
		)

		groupId = grupos[0].id
	})

	it("[G-11-F] - Grupo em rascunho é ativado; ativar de novo é recusado", async () => {
		const ativado = await postActivateGroup(
			groupId,
			groupsG11.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			ativado.json.status,
			groupsG11.activeStatus,
			"O grupo em rascunho não ficou ativo.",
		)

		const { json } = await postActivateGroup(
			groupId,
			groupsG11.paramsDefault400(adminParams.token),
		)

		assertTs.equal(
			json.message,
			groupsG11.alreadyActiveMessage,
			"A recusa de reativar um grupo já ativo não trouxe a mensagem especificada.",
		)
	})
})
