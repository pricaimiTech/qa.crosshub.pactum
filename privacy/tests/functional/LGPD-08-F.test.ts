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
import { privacyLGPD08 } from "@privacy-data/privacy.data"

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
			privacyLGPD08.loginParams,
		)

		await formsBusiness.cleanupByPrefix(privacyLGPD08.casePrefix, primaryParams)

		const answered = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder
				.withTitle(privacyLGPD08.casePrefix)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(privacyLGPD08.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			privacyLGPD08.answer,
			primaryParams,
		)

		submissionId = answered.submissionId

		const restricted = adminFor("LGPD-08")

		// Estado explícito: a execução anterior pode ter deixado o admin autorizado.
		restrictedAdminId = restricted.adminId

		await privacyBusiness.setSensitiveAccess(
			restrictedAdminId,
			false,
			primaryParams,
		)

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			privacyLGPD08.loginParams,
		)
	})

	it("[LGPD-08-F] - Autorização concedida vale na requisição seguinte, com o token que o admin já tinha", async () => {
		await getSubmission(
			submissionId,
			privacyLGPD08.paramsDefault403(restrictedParams.token),
		)

		await privacyBusiness.setSensitiveAccess(
			restrictedAdminId,
			true,
			primaryParams,
		)

		// Mesmo token de antes: a checagem é por consulta, não por claim do JWT.
		const { json } = await getSubmission(
			submissionId,
			privacyLGPD08.paramsDefault200(restrictedParams.token),
		)

		assertTs.exists(
			json.id,
			"A autorização recém-concedida não valeu para o token que o admin já tinha.",
		)
	})
})
