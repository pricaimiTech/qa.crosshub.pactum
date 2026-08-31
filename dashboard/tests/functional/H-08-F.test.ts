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
import getHome from "@core/services/dashboard/getHome.service"
import { adminFor } from "@core/utils/admin.utils"
import { endUsersFor } from "@core/utils/endUser.utils"
import { homeH08 } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let restrictedParams: IParamsDefault
	let sensitiveFormTitle: string

	before("Submissão sensível recente e um admin sem autorização", async () => {
		const primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			homeH08.loginParams,
		)

		await formsBusiness.cleanupByPrefix(homeH08.casePrefix, primaryParams)

		const form = formBuilder
			.withTitle(homeH08.casePrefix)
			.withSensitiveData(true)
			.build()

		sensitiveFormTitle = form.title

		await formsBusiness.createAnsweredSensitiveForm(
			form,
			questionsBuilder.reset().withShortText().build(),
			endUsersFor(homeH08.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			homeH08.secretAnswer,
			primaryParams,
		)

		const restricted = adminFor("H-08")

		await privacyBusiness.setSensitiveAccess(
			restricted.adminId,
			false,
			primaryParams,
		)

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			homeH08.loginParams,
		)
	})

	it("[H-08-F] - A Home do admin sem autorização não cita a submissão sensível", async () => {
		const { json } = await getHome(
			homeH08.paramsDefault200(restrictedParams.token),
		)

		assertTs.notInclude(
			JSON.stringify(json),
			sensitiveFormTitle,
			"O formulário sensível apareceu na Home de um admin sem autorização.",
		)

		assertTs.notInclude(
			JSON.stringify(json),
			homeH08.secretAnswer,
			"O conteúdo da resposta sensível apareceu na Home.",
		)
	})
})
