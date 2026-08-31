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
import { privacyLGPD04 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let restrictedParams: IParamsDefault
	let submissionId: string

	before("Submissão sensível existente e um admin sem autorização", async () => {
		const primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD04.loginParams,
		)

		await formsBusiness.cleanupByPrefix(privacyLGPD04.casePrefix, primaryParams)

		const answered = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder
				.withTitle(privacyLGPD04.casePrefix)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(privacyLGPD04.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			privacyLGPD04.answer,
			primaryParams,
		)

		submissionId = answered.submissionId

		const restricted = adminFor("LGPD-04")

		// Estado explícito: a execução anterior pode ter deixado o admin autorizado.
		await privacyBusiness.setSensitiveAccess(
			restricted.adminId,
			false,
			primaryParams,
		)

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			privacyLGPD04.loginParams,
		)
	})

	it("[LGPD-04-F] - Admin sem autorização recebe 403 ao abrir uma submissão sensível", async () => {
		const { json } = await getSubmission(
			submissionId,
			privacyLGPD04.paramsDefault403(restrictedParams.token),
		)

		assertTs.equal(
			json.message,
			privacyLGPD04.errorMessage,
			"A recusa da leitura sensível não trouxe o texto exato da especificação.",
		)
	})
})
