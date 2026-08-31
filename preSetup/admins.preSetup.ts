import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { authBusiness, preSetup } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListAdmins from "@core/services/tenants/getListAdmins.service"
import getListTenants from "@core/services/tenants/getListTenants.service"
import patchResetAdminPassword from "@core/services/tenants/patchResetAdminPassword.service"
import patchSensitiveDataAccess from "@core/services/privacy/patchSensitiveDataAccess.service"
import postCreateAdmin from "@core/services/tenants/postCreateAdmin.service"
import {
	adminAllocation,
	adminEmailFor,
	adminPassword,
	adminsFile,
} from "@shared-data/admins.data"

/** Admin de tenant reservado a um caso. */
interface IPooledAdmin {
	adminId: string
	email: string
	password: string
}

/**
 * Garante um admin de tenant por caso de permissão, todos **sem**
 * `canViewSensitiveData`.
 *
 * A permissão é estado global do tenant: sem um admin por caso, dois testes em
 * paralelo alterariam o mesmo registro e derrubariam um ao outro. O admin
 * principal fica de fora — o acesso dele é irrevogável.
 *
 * Idempotente: reaproveita os que já existem, redefine a senha e reaplica a
 * restrição.
 *
 * Rodar com `npm run pre-setup`.
 */
describe("preSetup", () => {
	it("Garante o pool de admins dos casos de permissão", async function () {
		this.timeout(300000)

		const platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			preSetup.preSetupParamsDefault(201, 5, 500),
		)

		const read200 = preSetup.preSetupParamsDefault200(
			5,
			500,
			platformParams.token,
		)
		const created201: IParamsDefault = preSetup.preSetupParamsDefault(
			201,
			5,
			500,
			platformParams.token,
		)

		const tenants = await getListTenants(read200)
		const tenant = tenants.json.filter(
			(item: { slug: string }) => item.slug === `${process.env.TENANT_SLUG}`,
		)[0]

		const admins = await getListAdmins(tenant.id, read200)

		const tenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			preSetup.preSetupParamsDefault(201, 5, 500),
		)
		const tenant200 = preSetup.preSetupParamsDefault200(
			5,
			500,
			tenantParams.token,
		)

		const pool: Record<string, IPooledAdmin> = {}

		for (const [caseId, purpose] of Object.entries(adminAllocation)) {
			const email = adminEmailFor(caseId)
			const existing = admins.json.filter(
				(admin: { email: string }) => admin.email === email,
			)

			const adminId: string = existing.length
				? existing[0].id
				: (
						await postCreateAdmin(
							tenant.id,
							{ name: `[${caseId}] ${purpose}`, email, password: adminPassword },
							created201,
						)
					).json.id

			await patchResetAdminPassword(
				tenant.id,
				adminId,
				{ password: adminPassword },
				read200,
			)
			await patchSensitiveDataAccess(adminId, { allowed: false }, tenant200)

			pool[caseId] = { adminId, email, password: adminPassword }
		}

		writeFileSync(
			resolve(process.cwd(), adminsFile),
			`${JSON.stringify({ tenantId: tenant.id, admins: pool }, null, 2)}\n`,
		)
	})
})
