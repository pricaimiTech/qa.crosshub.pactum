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
import { groupsG14 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let groupId: string
	let groupName: string

	before("Grupo manual finalizado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG14.loginParams,
		)

		const people = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(groupsG14.personPrefix)
					.withEmail(groupsG14.personPrefix)
					.build(),
			],
			adminParams,
		)

		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG14.casePrefix)
				.withPeople(people)
				.build(),
			groupsG14.paramsDefault201(adminParams.token),
		)

		groupId = grupos[0].id
		groupName = grupos[0].name

		await patchUpdateGroup(
			groupId,
			{ name: groupName, status: groupsG14.finalizedStatus },
			groupsG14.paramsDefault200(adminParams.token),
		)
	})

	it("[G-14-F] - Grupo finalizado volta para rascunho: o PATCH não tem máquina de estados", async () => {
		const { json } = await patchUpdateGroup(
			groupId,
			{ name: groupName, status: groupsG14.draftStatus },
			groupsG14.paramsDefault200(adminParams.token),
		)

		// O caso registra o comportamento real, que a estratégia marca como risco:
		// qualquer status pode virar qualquer outro pelo PATCH.
		assertTs.equal(
			json.status,
			groupsG14.draftStatus,
			"A volta de finalized para draft foi recusada — o comportamento mudou em relação ao registrado.",
		)
	})
})
