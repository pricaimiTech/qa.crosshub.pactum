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
import { groupsG09 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let memberIds: Array<string>

	before("Quatro pessoas cadastradas", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG09.loginParams,
		)

		memberIds = await formsBusiness.createPeople(
			Array.from({ length: groupsG09.memberCount }, () =>
				personBuilder
					.withName(groupsG09.personPrefix)
					.withEmail(groupsG09.personPrefix)
					.build(),
			),
			adminParams,
		)
	})

	it("[G-09-F] - Divisão fora dos limites é recusada; dentro deles, aceita", async () => {
		const mensagens = await groupsBusiness.rejectedGroups(
			groupsG09.invalidSplits.map((split) =>
				groupBuilder
					.withName(groupsG09.casePrefix)
					.withPeople(memberIds)
					.withSplit(split.groupCount, split.groupSize)
					.build(),
			),
			groupsG09.paramsDefault400(adminParams.token),
		)

		const semAMensagem = mensagens.filter(
			(mensagem) => !mensagem.includes(groupsG09.errorMessage),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Alguma configuração inválida de divisão não trouxe a mensagem especificada.",
		)

		const validos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG09.casePrefix)
				.withPeople(memberIds)
				.withSplit(
					groupsG09.validSplit.groupCount,
					groupsG09.validSplit.groupSize,
				)
				.build(),
			groupsG09.paramsDefault201(adminParams.token),
		)

		assertTs.isAbove(
			validos.length,
			0,
			"A configuração de divisão dentro dos limites foi recusada.",
		)
	})
})
