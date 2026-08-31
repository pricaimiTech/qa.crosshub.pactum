import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	personBuilder,
	privacyBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postAssignForm from "@core/services/forms/postAssignForm.service"
import { adminFor } from "@core/utils/admin.utils"
import { privacyLGPD05 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let restrictedParams: IParamsDefault
	let formId: string
	let personId: string

	before("Formulário sensível publicado e um admin sem autorização", async () => {
		const primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD05.loginParams,
		)

		await formsBusiness.cleanupByPrefix(privacyLGPD05.casePrefix, primaryParams)

		const published = await formsBusiness.createPublishedForm(
			formBuilder
				.withTitle(privacyLGPD05.casePrefix)
				.withSensitiveData(true)
				.build(),
			questionsBuilder.reset().withShortText().build(),
			primaryParams,
		)

		formId = published.formId

		const people = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(privacyLGPD05.casePrefix)
					.withEmail(privacyLGPD05.casePrefix)
					.build(),
			],
			primaryParams,
		)

		personId = people[0]

		const restricted = adminFor("LGPD-05")

		await privacyBusiness.setSensitiveAccess(
			restricted.adminId,
			false,
			primaryParams,
		)

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			privacyLGPD05.loginParams,
		)
	})

	it("[LGPD-05-F] - Admin sem autorização não consegue enviar formulário sensível", async () => {
		const { json } = await postAssignForm(
			formId,
			{ personIds: [personId] },
			privacyLGPD05.paramsDefault403(restrictedParams.token),
		)

		assertTs.equal(
			json.statusCode,
			403,
			"O admin sem autorização conseguiu enviar um formulário sensível.",
		)
	})
})
