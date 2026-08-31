import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListForms from "@core/services/forms/getListForms.service"
import getListQuestions from "@core/services/forms/getListQuestions.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { formsFXT } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let firstTenantParams: IParamsDefault
	let secondTenantFormId: string

	before("Formulário publicado no tenant B", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			formsFXT.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsFXT.casePrefix, secondTenantParams)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(formsFXT.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			secondTenantParams,
		)

		secondTenantFormId = published.formId

		firstTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsFXT.loginParams,
		)
	})

	it("[F-XT-F] - Tenant A não lista nem acessa por id o formulário do tenant B", async () => {
		const { json } = await getListForms(
			formsFXT.paramsDefault200(firstTenantParams.token),
		)

		assertTs.notInclude(
			JSON.stringify(json),
			secondTenantFormId,
			"Um formulário do tenant B apareceu na listagem do tenant A.",
		)

		await getListQuestions(
			secondTenantFormId,
			formsFXT.paramsDefault404(firstTenantParams.token),
		)
	})
})
