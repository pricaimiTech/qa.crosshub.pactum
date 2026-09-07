import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListPeople from "@core/services/people/getListPeople.service"
import patchUpdatePerson from "@core/services/people/patchUpdatePerson.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { peopleCXT } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let firstTenantParams: IParamsDefault
	let foreignPersonId: string
	let foreignPersonName: string

	before("Pessoa cadastrada no tenant B", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			peopleCXT.loginParams,
		)

		const person = personBuilder
			.withName(peopleCXT.casePrefix)
			.withEmail(peopleCXT.casePrefix)
			.build()

		foreignPersonName = person.name

		const created = await peopleBusiness.createPersonWithCode(
			person,
			secondTenantParams,
		)

		foreignPersonId = created.personId

		firstTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleCXT.loginParams,
		)
	})

	it("[C-XT-F] - Tenant A não lista nem edita a pessoa do tenant B", async () => {
		const { json } = await getListPeople(
			{},
			peopleCXT.paramsDefault200(firstTenantParams.token),
		)

		const vazada = json.filter(
			(item: { id: string }) => item.id === foreignPersonId,
		)

		assertTs.lengthOf(
			vazada,
			0,
			"Uma pessoa do tenant B apareceu na listagem do tenant A.",
		)

		await patchUpdatePerson(
			foreignPersonId,
			{ name: foreignPersonName, notes: peopleCXT.updatedNotes },
			peopleCXT.paramsDefault404(firstTenantParams.token),
		)
	})
})
