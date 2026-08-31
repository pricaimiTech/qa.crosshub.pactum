import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	describeName,
	formsBusiness,
	groupBuilder,
	groupsBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListGroups from "@core/services/groups/getListGroups.service"
import patchUpdateGroup from "@core/services/groups/patchUpdateGroup.service"
import postActivateGroup from "@core/services/groups/postActivateGroup.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { groupsGXT } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let firstTenantParams: IParamsDefault
	let foreignGroupId: string

	before("Grupo criado no tenant B", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			groupsGXT.loginParams,
		)

		const people = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(groupsGXT.personPrefix)
					.withEmail(groupsGXT.personPrefix)
					.build(),
			],
			secondTenantParams,
		)

		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsGXT.casePrefix)
				.withPeople(people)
				.build(),
			groupsGXT.paramsDefault201(secondTenantParams.token),
		)

		foreignGroupId = grupos[0].id

		firstTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsGXT.loginParams,
		)
	})

	it("[G-XT-F] - Tenant A não lista, não edita e não ativa o grupo do tenant B", async () => {
		const { json } = await getListGroups(
			groupsGXT.paramsDefault200(firstTenantParams.token),
		)

		const vazado = json.filter(
			(grupo: { id: string }) => grupo.id === foreignGroupId,
		)

		assertTs.lengthOf(
			vazado,
			0,
			"Um grupo do tenant B apareceu na listagem do tenant A.",
		)

		await patchUpdateGroup(
			foreignGroupId,
			{ name: groupsGXT.editedName, status: "draft" },
			groupsGXT.paramsDefault404(firstTenantParams.token),
		)

		await postActivateGroup(
			foreignGroupId,
			groupsGXT.paramsDefault404(firstTenantParams.token),
		)
	})
})
