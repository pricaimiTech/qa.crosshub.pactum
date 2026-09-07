import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getSubmission from "@core/services/forms/getSubmission.service"
import patchUpdateSettings from "@core/services/privacy/patchUpdateSettings.service"
import postRunRetention from "@core/services/privacy/postRunRetention.service"
import postBackdate from "@core/services/fixtures/postBackdate.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { privacyLGPD11 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let submissionId: string
	let expiredSubmissionId: string

	before("Resposta sensível criada agora, com a retenção no mínimo de 1 dia", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD11.loginParams,
		)

		await formsBusiness.cleanupByPrefix(privacyLGPD11.casePrefix, primaryParams)

		const answered = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder
				.withTitle(privacyLGPD11.casePrefix)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(privacyLGPD11.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			privacyLGPD11.answer,
			primaryParams,
		)

		submissionId = answered.submissionId

		// A resposta expirada: mesma pessoa, formulário irmão, envelhecida pela
		// rota de fixtures para além do prazo (#123 destravou a metade que
		// realmente apaga dado de gente).
		const expired = await formsBusiness.createAnsweredSensitiveForm(
			formBuilder
				.withTitle(`${privacyLGPD11.casePrefix} expirada`)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(privacyLGPD11.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			privacyLGPD11.answer,
			primaryParams,
		)
		expiredSubmissionId = expired.submissionId
		await postBackdate(
			{
				entity: "form_submission",
				id: expiredSubmissionId,
				at: new Date(Date.now() - privacyLGPD11.expiredAgeDays * 24 * 60 * 60 * 1000).toISOString(),
			},
			privacyLGPD11.paramsDefault201(primaryParams.token),
		)

		await patchUpdateSettings(
			{ sensitiveDataRetentionDays: privacyLGPD11.retentionDays },
			privacyLGPD11.paramsDefault200(primaryParams.token),
		)
	})

	after("Devolve a política de retenção ao padrão", async () => {
		await patchUpdateSettings(
			{ sensitiveDataRetentionDays: privacyLGPD11.defaultRetentionDays },
			privacyLGPD11.paramsDefault200(primaryParams.token),
		)
	})

	it("[LGPD-11-F] - A retenção não apaga resposta sensível dentro do prazo", async () => {
		await postRunRetention(privacyLGPD11.paramsDefault201(primaryParams.token))

		const { json } = await getSubmission(
			submissionId,
			privacyLGPD11.paramsDefault200(primaryParams.token),
		)

		assertTs.exists(
			json.id,
			"A retenção apagou uma resposta sensível criada agora, dentro do prazo de 1 dia.",
		)
	})

	it("[LGPD-11-F] - A retenção apaga a resposta sensível fora do prazo", async () => {
		await postRunRetention(privacyLGPD11.paramsDefault201(primaryParams.token))

		await getSubmission(
			expiredSubmissionId,
			privacyLGPD11.paramsDefault404(primaryParams.token),
		)
	})
})
