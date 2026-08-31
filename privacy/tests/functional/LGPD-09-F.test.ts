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
import { endUsersFor } from "@core/utils/endUser.utils"
import { adminFor } from "@core/utils/admin.utils"
import { privacyLGPD09 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let restrictedParams: IParamsDefault
	let restrictedAdminId: string
	let submissionId: string

	before("Submissão sensível existente e um admin sem autorização", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD09.loginParams,
		)

		await formsBusiness.cleanupByPrefix(privacyLGPD09.casePrefix, primaryParams)

		const answered = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder
				.withTitle(privacyLGPD09.casePrefix)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(privacyLGPD09.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			privacyLGPD09.answer,
			primaryParams,
		)

		submissionId = answered.submissionId

		const restricted = adminFor("LGPD-09")

		// Estado explícito: o caso começa com o admin **autorizado**.
		restrictedAdminId = restricted.adminId

		await privacyBusiness.setSensitiveAccess(
			restrictedAdminId,
			true,
			primaryParams,
		)

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			privacyLGPD09.loginParams,
		)
	})

	it("[LGPD-09-F] - Revogação vale na requisição seguinte, com o token que o admin já tinha", async () => {
		const autorizado = await getSubmission(
			submissionId,
			privacyLGPD09.paramsDefault200(restrictedParams.token),
		)

		assertTs.exists(
			autorizado.id || autorizado.json.id,
			"O admin autorizado não conseguiu ler a submissão sensível.",
		)

		await privacyBusiness.setSensitiveAccess(
			restrictedAdminId,
			false,
			primaryParams,
		)

		// Mesmo token de antes: a revogação vale já na próxima requisição.
		const { json } = await getSubmission(
			submissionId,
			privacyLGPD09.paramsDefault403(restrictedParams.token),
		)

		assertTs.equal(
			json.statusCode,
			403,
			"O admin continuou lendo a submissão sensível depois da revogação.",
		)
	})
})
