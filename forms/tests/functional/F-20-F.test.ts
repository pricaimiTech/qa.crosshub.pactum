import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListAllSubmissions from "@core/services/forms/getListAllSubmissions.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { adminFor } from "@core/utils/admin.utils"
import { formsF20 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let restrictedParams: IParamsDefault
	let personId: string

	before("Uma resposta em formulário comum e outra em formulário sensível", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF20.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF20.casePrefix, primaryParams)

		const person = endUsersFor(formsF20.caseId)[0]
		personId = person.personId

		const common = await formsBusiness.createAssignedForm(
			formBuilder.withTitle(formsF20.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			personId,
			primaryParams,
		)

		const sensitive = await formsBusiness.createAssignedForm(
			formBuilder
				.withTitle(formsF20.casePrefix)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			personId,
			primaryParams,
		)

		const clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			formsF20.loginParams,
		)

		await formsBusiness.submitTextAnswers(
			common.formId,
			common.questionIds,
			"Resposta comum",
			formsF20.paramsDefault201(clientParams.token),
		)
		await formsBusiness.submitTextAnswers(
			sensitive.formId,
			sensitive.questionIds,
			"Resposta sensível",
			formsF20.paramsDefault201(clientParams.token),
		)

		const restricted = adminFor("F-20")

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			formsF20.loginParams,
		)
	})

	it("[F-20-F] - O total da listagem não conta as respostas sensíveis que o admin não pode ver", async () => {
		// Comparar os dois totais é imune à paginação: o que importa é que o
		// agregado do admin restrito seja menor, e não que ele bata com o número
		// de itens de uma página.
		const doPrincipal = await getListAllSubmissions(
			{ personId },
			formsF20.paramsDefault200(primaryParams.token),
		)
		const doRestrito = await getListAllSubmissions(
			{ personId },
			formsF20.paramsDefault200(restrictedParams.token),
		)

		assertTs.isBelow(
			doRestrito.json.total,
			doPrincipal.json.total,
			"O `total` do admin sem permissão é igual ao do Principal — o agregado conta respostas que a lista esconde, e ele descobre quantas sensíveis existem.",
		)
	})
})
