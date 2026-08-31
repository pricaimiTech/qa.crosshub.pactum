import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	describeName,
	privacyBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchSensitiveDataAccess from "@core/services/privacy/patchSensitiveDataAccess.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { privacyLGPDXT } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let foreignAdminId: string

	before("Principal do tenant A e o admin do tenant B", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPDXT.loginParams,
		)

		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		foreignAdminId = secondTenant.adminId
	})

	it("[LGPD-XT-F] - A lista de profissionais não traz admin de outro tenant, e o PATCH cruzado dá 404", async () => {
		const professionals = await privacyBusiness.professionals(
			privacyLGPDXT.paramsDefault200(primaryParams.token),
		)

		const doOutroTenant = professionals.filter(
			(professional) => professional.id === foreignAdminId,
		)

		assertTs.lengthOf(
			doOutroTenant,
			0,
			"Um admin do tenant B apareceu na lista de profissionais do tenant A.",
		)

		await patchSensitiveDataAccess(
			foreignAdminId,
			{ allowed: true },
			privacyLGPDXT.paramsDefault404(primaryParams.token),
		)
	})
})
