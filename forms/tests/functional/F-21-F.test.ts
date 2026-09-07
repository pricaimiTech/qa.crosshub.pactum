import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getList from "@core/services/audit/getList.service"
import getSubmission from "@core/services/forms/getSubmission.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF21 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let submissionId: string

	before("Resposta sensível criada e aberta pelo Administrador Principal", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF21.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF21.casePrefix, primaryParams)

		const answered = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder.withTitle(formsF21.casePrefix).withSensitiveData(true).build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(formsF21.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			formsF21.answer,
			primaryParams,
		)

		submissionId = answered.submissionId

		await getSubmission(submissionId, formsF21.paramsDefault200(primaryParams.token))
	})

	it("[F-21-F] - Abrir uma resposta sensível registra sensitive_submission.viewed com ator e alvo, e a trilha é legível pela API", async () => {
		const { json } = await getList(
			{ action: formsF21.auditAction, entityId: submissionId },
			formsF21.paramsDefault200(primaryParams.token),
		)

		assertTs.isAtLeast(
			json.total,
			1,
			"A leitura da resposta sensível não deixou registro na trilha de auditoria.",
		)

		const registro = json.items[0]

		assertTs.equal(registro.action, formsF21.auditAction, "A ação registrada não é a especificada.")
		assertTs.equal(registro.entityType, "form_submission", "O alvo registrado não é a resposta.")
		assertTs.equal(registro.entityId, submissionId, "O registro não aponta para a resposta aberta.")
		assertTs.exists(registro.actorUserId, "O registro não identifica quem abriu a resposta.")

		// Metadado identifica o evento; nunca carrega a resposta.
		assertTs.notInclude(
			JSON.stringify(registro.metadata),
			formsF21.answer,
			"A trilha carregou o conteúdo da resposta sensível.",
		)
	})

	it("[F-21-F] - Filtro inválido é recusado e a trilha vem paginada", async () => {
		await getList(
			{ actorId: "nao-e-um-uuid" },
			formsF21.paramsDefault400(primaryParams.token),
		)

		const { json } = await getList(
			{ page: 1, pageSize: 1 },
			formsF21.paramsDefault200(primaryParams.token),
		)

		assertTs.equal(json.page, 1, "O envelope não ecoa a página.")
		assertTs.equal(json.pageSize, 1, "O envelope não ecoa o pageSize.")
		assertTs.isAtMost(json.items.length, 1, "A página trouxe mais itens que o pageSize.")
	})
})
