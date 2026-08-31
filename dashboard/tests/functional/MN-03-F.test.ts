import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	privacyBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getSubmission from "@core/services/forms/getSubmission.service"
import patchSensitiveDataAccess from "@core/services/privacy/patchSensitiveDataAccess.service"
import { adminFor } from "@core/utils/admin.utils"
import { endUsersFor } from "@core/utils/endUser.utils"
import { menuMN03 } from "@dashboard-data/menu.data"

describe(describeName.dashboard, () => {
	let restrictedParams: IParamsDefault
	let submissionId: string
	let targetAdminId: string

	before("Submissão sensível e um admin que não enxerga o item no menu", async () => {
		const primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			menuMN03.loginParams,
		)

		await formsBusiness.cleanupByPrefix(menuMN03.casePrefix, primaryParams)

		const answered = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder
				.withTitle(menuMN03.casePrefix)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(menuMN03.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			menuMN03.answer,
			primaryParams,
		)

		submissionId = answered.submissionId

		const restricted = adminFor(menuMN03.caseId)
		targetAdminId = restricted.adminId

		await privacyBusiness.setSensitiveAccess(
			targetAdminId,
			false,
			primaryParams,
		)

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			menuMN03.loginParams,
		)
	})

	it("[MN-03-F] - As rotas que o menu esconderia recusam sozinhas: esconder não é a defesa", async () => {
		// Leitura de resposta sensível — o item some do menu para este admin.
		const leitura = await getSubmission(
			submissionId,
			menuMN03.paramsDefault403(restrictedParams.token),
		)

		assertTs.equal(
			leitura.json.message,
			menuMN03.errorMessage,
			"A leitura sensível não foi recusada pela API, só escondida no menu.",
		)

		// Conceder permissão a si mesmo — a tela nem oferece o botão.
		const concessao = await patchSensitiveDataAccess(
			targetAdminId,
			{ allowed: true },
			menuMN03.paramsDefault403(restrictedParams.token),
		)

		assertTs.equal(
			concessao.json.statusCode,
			403,
			"Um admin comum conseguiu se autoconceder acesso chamando a rota direto.",
		)
	})
})
