import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getFormInsights from "@core/services/forms/getFormInsights.service"
import postAssignForm from "@core/services/forms/postAssignForm.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { formsF23 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string

	before("Formulário de escala com três respostas conhecidas: 1, 3 e 5", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF23.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF23.casePrefix, adminParams)

		const clients = endUsersFor(formsF23.caseId)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(formsF23.casePrefix).build(),
			questionsBuilder.reset().withScale().build(),
			adminParams,
		)

		formId = published.formId

		await postAssignForm(
			formId,
			{ personIds: clients.map((client) => client.personId) },
			formsF23.paramsDefault201(adminParams.token),
		)

		await formsBusiness.submitScaleAnswersAsClients(
			clients,
			`${process.env.TENANT_SLUG}`,
			formId,
			published.questionIds[0],
			formsF23.scaleValues,
			formsF23.paramsDefault201(),
		)
	})

	it(`[F-23-F] - Média da escala confere com o cálculo manual e a distribuição soma 100%`, async () => {
		const { json } = await getFormInsights(
			formId,
			formsF23.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.totals.overallAverage,
			formsF23.expectedAverage,
			"A média geral da escala não bate com o cálculo manual de 1, 3 e 5.",
		)

		const somaPercentual = json.scaleQuestions[0].distribution.reduce(
			(total: number, bucket: { percent: number }) => total + bucket.percent,
			0,
		)

		assertTs.equal(
			Math.round(somaPercentual),
			formsF23.expectedDistributionPercent,
			"A distribuição da escala não soma 100%.",
		)
	})
})
