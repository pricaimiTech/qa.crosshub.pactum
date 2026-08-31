import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	describeName,
	formsBusiness,
	groupBuilder,
	groupsBusiness,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { secondTenantFile } from "@shared-data/tenants.data"
import { groupsG03 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personIds: Array<string>

	before("Duas pessoas do tenant A e uma do tenant B", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG03.loginParams,
		)

		const validIds = await formsBusiness.createPeople(
			Array.from({ length: groupsG03.validMemberCount }, () =>
				personBuilder
					.withName(groupsG03.personPrefix)
					.withEmail(groupsG03.personPrefix)
					.build(),
			),
			adminParams,
		)

		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			groupsG03.loginParams,
		)

		const foreigner = await peopleBusiness.createPersonWithCode(
			personBuilder
				.withName(groupsG03.personPrefix)
				.withEmail(groupsG03.personPrefix)
				.build(),
			secondTenantParams,
		)

		personIds = [...validIds, foreigner.personId]
	})

	it("[G-03-F] - Uma pessoa de outro tenant invalida a criação inteira do grupo", async () => {
		await groupsBusiness.rejectedGroups(
			[
				groupBuilder
					.withName(groupsG03.casePrefix)
					.withPeople(personIds)
					.build(),
			],
			groupsG03.paramsDefault400(adminParams.token),
		)

		const criados = await groupsBusiness.groupsByPrefix(
			groupsG03.casePrefix,
			adminParams,
		)

		assertTs.lengthOf(
			criados,
			0,
			"Um grupo foi criado apesar de a lista conter uma pessoa de outro tenant.",
		)
	})
})
