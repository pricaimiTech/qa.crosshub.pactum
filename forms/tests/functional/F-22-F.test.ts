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
import getListFormSubmissions from "@core/services/forms/getListFormSubmissions.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF22 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Três respostas da mesma pessoa em um formulário MULTIPLE", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF22.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF22.casePrefix, adminParams)

		const person = endUsersFor(formsF22.caseId)[0]

		const published = await formsBusiness.createAssignedForm(
			formBuilder
				.withTitle(formsF22.casePrefix)
				.withSubmissionMode(formsF22.submissionMode)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			person.personId,
			adminParams,
		)

		formId = published.formId

		const clientParams = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			person.email,
			person.password,
			formsF22.loginParams,
		)

		await formsBusiness.submitTextAnswersTimes(
			formId,
			published.questionIds,
			formsF22.answer,
			formsF22.submissionCount,
			formsF22.paramsDefault201(clientParams.token),
		)
	})

	it("[F-22-F] - Paginação divide as respostas, respeita o limite do contrato e a página além do fim volta vazia", async () => {
		// Paginação conferida **no formulário do caso**: a pessoa acumula respostas
		// de execuções anteriores, porque formulário com resposta não pode ser
		// excluído — então o total por pessoa cresce a cada rodada.
		const primeira = await getListFormSubmissions(
			formId,
			{ page: 1, pageSize: formsF22.pageSize },
			formsF22.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			primeira.json.items,
			formsF22.pageSize,
			"A primeira página não devolveu exatamente o `pageSize` pedido.",
		)

		assertTs.equal(
			primeira.json.totalPages,
			formsF22.expectedTotalPages,
			"O número de páginas não corresponde às respostas da pessoa.",
		)

		await getListAllSubmissions(
			{ page: 1, pageSize: formsF22.pageSizeOverLimit },
			formsF22.paramsDefault400(adminParams.token),
		)

		const alemDoFim = await getListFormSubmissions(
			formId,
			{ page: formsF22.pageBeyondEnd, pageSize: formsF22.pageSize },
			formsF22.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			alemDoFim.json.items,
			0,
			"A página além do fim devolveu itens.",
		)

		assertTs.equal(
			alemDoFim.json.total,
			formsF22.submissionCount,
			"O `total` da página além do fim não reflete as respostas da pessoa.",
		)
	})
})
