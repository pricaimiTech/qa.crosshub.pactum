import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchSensitiveDataAccess from "@core/services/privacy/patchSensitiveDataAccess.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { privacyLGPD07 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let foreignAdminId: string

	before("Principal do tenant A e um admin que vive no tenant B", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD07.loginParams,
		)

		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		foreignAdminId = secondTenant.adminId
	})

	it("[LGPD-07-F] - Alvo inexistente ou de outro tenant devolve 404, não 403", async () => {
		const inexistente = await patchSensitiveDataAccess(
			privacyLGPD07.unknownUserId,
			{ allowed: true },
			privacyLGPD07.paramsDefault404(primaryParams.token),
		)

		assertTs.equal(
			inexistente.json.message,
			privacyLGPD07.errorMessage,
			"O alvo inexistente não trouxe a mensagem especificada.",
		)

		const deOutroTenant = await patchSensitiveDataAccess(
			foreignAdminId,
			{ allowed: true },
			privacyLGPD07.paramsDefault404(primaryParams.token),
		)

		assertTs.equal(
			deOutroTenant.json.message,
			privacyLGPD07.errorMessage,
			"O alvo de outro tenant revelou tratamento diferente do alvo inexistente.",
		)
	})
})
