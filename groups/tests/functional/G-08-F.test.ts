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
import { groupsG08 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let memberIds: Array<string>

	before("Seis pessoas cadastradas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG08.loginParams,
		)

		memberIds = await formsBusiness.createPeople(
			Array.from({ length: groupsG08.memberCount }, () =>
				personBuilder
					.withName(groupsG08.personPrefix)
					.withEmail(groupsG08.personPrefix)
					.build(),
			),
			adminParams,
		)
	})

	it("[G-08-F] - Sem formulário, a estratégia não tem resposta para comparar e a composição é a mesma", async () => {
		const composicoes = await groupsBusiness.compositionsOf(
			groupsG08.strategies.map((strategy) =>
				groupBuilder
					.withName(groupsG08.casePrefix)
					.withPeople(memberIds)
					.withStrategy(strategy)
					.build(),
			),
			groupsG08.paramsDefault201(adminParams.token),
		)

		const diferentes = composicoes.filter(
			(composicao) => composicao !== composicoes[0],
		)

		assertTs.deepEqual(
			diferentes,
			[],
			"Com origem em pessoas não há resposta para comparar: as estratégias deveriam produzir a mesma composição. Quando há formulário, elas divergem — é o G-08b.",
		)
	})
})
