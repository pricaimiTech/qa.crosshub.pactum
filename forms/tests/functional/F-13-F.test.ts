import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	personBuilder,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListFormAssignments from "@core/services/forms/getListFormAssignments.service"
import postAssignForm from "@core/services/forms/postAssignForm.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { formsF13 } from "@forms-data/forms.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let formId: string
	let personIds: Array<string>

	before("Formulário publicado, quatro pessoas do tenant e uma de outro tenant", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			formsF13.loginParams,
		)

		await formsBusiness.cleanupByPrefix(formsF13.casePrefix, adminParams)

		const published = await formsBusiness.createPublishedForm(
			formBuilder.withTitle(formsF13.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			adminParams,
		)

		formId = published.formId

		const validIds = await formsBusiness.createPeople(
			Array.from({ length: formsF13.validPeopleCount }, () =>
				personBuilder
					.withName(formsF13.personPrefix)
					.withEmail(formsF13.personPrefix)
					.build(),
			),
			adminParams,
		)

		// A quinta pessoa vive no tenant B — é a que deve abortar o lote.
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			formsF13.loginParams,
		)

		const foreigner = await postCreatePerson(
			personBuilder
				.withName(formsF13.personPrefix)
				.withEmail(formsF13.personPrefix)
				.build(),
			formsF13.paramsDefault201(secondTenantParams.token),
		)

		personIds = [...validIds, foreigner.json.id]
	})

	it("[F-13-F] - Uma pessoa de outro tenant aborta o lote inteiro de atribuições", async () => {
		await postAssignForm(
			formId,
			{ personIds },
			formsF13.paramsDefault400(adminParams.token),
		)

		const { json } = await getListFormAssignments(
			formId,
			formsF13.paramsDefault200(adminParams.token),
		)

		assertTs.lengthOf(
			json.assignments,
			formsF13.expectedAssignments,
			"Alguma atribuição do lote foi criada apesar da pessoa inválida — a operação não é atômica.",
		)
	})
})
