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
import { groupsG01 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let memberIds: Array<string>

	before("Três pessoas cadastradas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG01.loginParams,
		)

		memberIds = await formsBusiness.createPeople(
			Array.from({ length: groupsG01.memberCount }, () =>
				personBuilder
					.withName(groupsG01.personPrefix)
					.withEmail(groupsG01.personPrefix)
					.build(),
			),
			adminParams,
		)
	})

	it("[G-01-F] - Criação manual gera um grupo com os integrantes na ordem enviada", async () => {
		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG01.casePrefix)
				.withPeople(memberIds)
				.build(),
			groupsG01.paramsDefault201(adminParams.token),
		)

		assertTs.lengthOf(
			grupos,
			groupsG01.expectedGroups,
			"A criação manual devolveu um número de grupos diferente de um.",
		)

		assertTs.equal(
			grupos[0].participantCount,
			groupsG01.memberCount,
			"O grupo não ficou com as três pessoas enviadas.",
		)

		assertTs.deepEqual(
			grupos[0].participantIds,
			memberIds,
			"A ordem dos integrantes mudou em relação à ordem enviada.",
		)
	})
})
