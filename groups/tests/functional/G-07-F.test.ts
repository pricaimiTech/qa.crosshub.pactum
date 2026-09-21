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
import { groupsG07 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let memberIds: Array<string>

	before("Vinte e cinco pessoas cadastradas", async function () {
		this.timeout(120000)

		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG07.loginParams,
		)

		memberIds = await formsBusiness.createPeople(
			Array.from({ length: groupsG07.memberCount }, () =>
				personBuilder
					.withName(groupsG07.personPrefix)
					.withEmail(groupsG07.personPrefix)
					.build(),
			),
			adminParams,
		)
	})

	it("[G-07-F] - Divisão reparte entre os grupos pedidos e não cria grupo vazio", async () => {
		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG07.casePrefix)
				.withPeople(memberIds)
				.withSplit(groupsG07.groupCount, groupsG07.groupSize)
				.build(),
			groupsG07.paramsDefault201(adminParams.token),
		)

		const tamanhos = grupos.map((grupo) => grupo.participantCount)

		assertTs.deepEqual(
			tamanhos,
			groupsG07.expectedSizes,
			`A divisão de ${groupsG07.memberCount} pessoas em ${groupsG07.groupCount} grupos de até ${groupsG07.groupSize} não repartiu os participantes: ${tamanhos.join(", ")}. groupSize é teto, não meta.`,
		)
	})

	it("[G-07-F] - O que não cabe na configuração continua ficando de fora", async () => {
		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG07.casePrefix)
				.withPeople(memberIds)
				.withSplit(groupsG07.overflowGroupCount, groupsG07.overflowGroupSize)
				.build(),
			groupsG07.paramsDefault201(adminParams.token),
		)

		const tamanhos = grupos.map((grupo) => grupo.participantCount)

		assertTs.deepEqual(
			tamanhos,
			groupsG07.overflowExpectedSizes,
			`${groupsG07.memberCount} pessoas em ${groupsG07.overflowGroupCount} grupos de ${groupsG07.overflowGroupSize} não cabem: o excedente fica de fora, e os grupos não passam do teto. Veio: ${tamanhos.join(", ")}.`,
		)
	})
})
