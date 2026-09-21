import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	groupsBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF25 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let encerrado: Awaited<
		ReturnType<typeof formsBusiness.createClosedScaleForm>
	>

	before(
		"Formulário de formação de grupos, com composição configurada e respondido",
		async () => {
			adminParams = await authBusiness.loginAsTenantAdmin(
				`${process.env.TENANT_SLUG}`,
				`${process.env.TENANT_EMAIL}`,
				`${process.env.TENANT_PASSWORD}`,
				formsF25.loginParams,
			)

			await formsBusiness.cleanupByPrefix(formsF25.casePrefix, adminParams)

			encerrado = await formsBusiness.createClosedScaleForm(
				formBuilder
					.withTitle(formsF25.casePrefix)
					.withType(formsF25.formType)
					.withGrouping(
						formsF25.groupingGroupCount,
						formsF25.groupingGroupSize,
						formsF25.groupingStrategy,
					)
					.build(),
				endUsersFor(formsF25.caseId),
				`${process.env.TENANT_SLUG}`,
				formsF25.scaleValues,
				adminParams,
			)
		},
	)

	it("[F-25-F] - Encerrar a coleta cria os grupos em rascunho, sem ativar nada", async () => {
		assertTs.equal(
			encerrado.closed.groupsCreated,
			formsF25.groupingGroupCount,
			"O encerramento não criou os grupos que a composição do formulário pedia.",
		)

		const grupos = await groupsBusiness.groupsOfForm(
			encerrado.formId,
			adminParams,
		)

		assertTs.equal(
			grupos.length,
			formsF25.groupingGroupCount,
			"A listagem não traz os grupos que o encerramento diz ter criado.",
		)

		const ativados = grupos.filter(
			(grupo) => grupo.status !== formsF25.draftStatus,
		)

		assertTs.deepEqual(
			ativados,
			[],
			"Grupo criado pelo encerramento nasceu fora de rascunho — a ativação tem de continuar sendo um passo explícito.",
		)
	})
})
