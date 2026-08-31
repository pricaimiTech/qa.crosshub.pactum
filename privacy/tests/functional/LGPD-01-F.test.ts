import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	describeName,
	privacyBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { secondTenantFile } from "@shared-data/tenants.data"
import { privacyLGPD01 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let secondTenantParams: IParamsDefault
	let firstAdminId: string
	let extraAdminId: string

	before("Tenant B, com o admin de criação e um segundo admin", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		firstAdminId = secondTenant.adminId
		extraAdminId = secondTenant.extraAdminId

		secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			privacyLGPD01.loginParams,
		)
	})

	it("[LGPD-01-F] - O primeiro admin do tenant nasce Principal e autorizado; o segundo, nenhum dos dois", async () => {
		const primeiro = await privacyBusiness.professionalById(
			firstAdminId,
			privacyLGPD01.paramsDefault200(secondTenantParams.token),
		)

		assertTs.isTrue(
			primeiro.isPrimaryAdmin,
			"O primeiro admin do tenant não nasceu Administrador Principal.",
		)

		assertTs.isTrue(
			primeiro.canViewSensitiveData,
			"O primeiro admin do tenant não nasceu autorizado a ver dados sensíveis.",
		)

		const segundo = await privacyBusiness.professionalById(
			extraAdminId,
			privacyLGPD01.paramsDefault200(secondTenantParams.token),
		)

		assertTs.isFalse(
			segundo.isPrimaryAdmin,
			"O segundo admin do tenant nasceu como Administrador Principal.",
		)

		assertTs.isFalse(
			segundo.canViewSensitiveData,
			"O segundo admin do tenant nasceu autorizado a ver dados sensíveis.",
		)
	})
})
