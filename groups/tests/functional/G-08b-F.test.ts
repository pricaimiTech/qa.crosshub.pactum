import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	groupBuilder,
	groupsBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { endUsersFor } from "@core/utils/endUser.utils"
import { groupsG08b } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let answerByPerson: Record<string, number>

	before(
		"Formulário de formação de times, respondido com valores intercalados",
		async () => {
			adminParams = await authBusiness.loginAsTenantAdmin(
				`${process.env.TENANT_SLUG}`,
				`${process.env.TENANT_EMAIL}`,
				`${process.env.TENANT_PASSWORD}`,
				groupsG08b.loginParams,
			)

			await formsBusiness.cleanupByPrefix(groupsG08b.casePrefix, adminParams)

			const respondido = await formsBusiness.createClosedScaleForm(
				formBuilder
					.withTitle(groupsG08b.casePrefix)
					.withType(groupsG08b.formType)
					.build(),
				endUsersFor(groupsG08b.caseId),
				`${process.env.TENANT_SLUG}`,
				groupsG08b.scaleValues,
				adminParams,
			)

			formId = respondido.formId
			answerByPerson = respondido.answerByPerson
		},
	)

	it(`[G-08b-F] - A estratégia "similar" agrupa quem respondeu igual, não quem respondeu antes`, async () => {
		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG08b.casePrefix)
				.withForm(formId)
				.withSplit(groupsG08b.groupCount, groupsG08b.groupSize)
				.withStrategy(groupsG08b.strategy)
				.build(),
			groupsG08b.paramsDefault201(adminParams.token),
		)

		// Em cada grupo, a resposta de todos deve ser a mesma. Com as respostas
		// intercaladas no envio, isso só acontece se o algoritmo olhar o conteúdo.
		const gruposMisturados = grupos
			.map((grupo) =>
				grupo.participantIds.map((personId) => answerByPerson[personId]),
			)
			.filter((respostas) => new Set(respostas).size > 1)

		assertTs.deepEqual(
			gruposMisturados,
			[],
			`A estratégia "${groupsG08b.strategy}" ignorou as respostas: ${grupos
					.map(
						(grupo) =>
							`[${grupo.participantIds
								.map((personId) => answerByPerson[personId])
								.join(",")}]`,
					)
					.join(" ")}. A divisão seguiu a ordem de envio.`,
		)
	})
})
