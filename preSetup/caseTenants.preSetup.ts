import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { authBusiness, preSetup } from "@core/constants"
import getListAdmins from "@core/services/tenants/getListAdmins.service"
import getListPlans from "@core/services/plans/getListPlans.service"
import getListTenants from "@core/services/tenants/getListTenants.service"
import patchResetAdminPassword from "@core/services/tenants/patchResetAdminPassword.service"
import postCreateAdmin from "@core/services/tenants/postCreateAdmin.service"
import postCreateTenant from "@core/services/tenants/postCreateTenant.service"
import {
	caseTenantPassword,
	caseTenantSlug,
	caseTenantsFile,
	tenantAllocation,
} from "@shared-data/tenants.data"

/** Tenant reservado a um caso. */
interface IPooledTenant {
	tenantId: string
	slug: string
	adminEmail: string
	adminPassword: string
}

/**
 * Garante um tenant por caso que escreve estado global do tenant.
 *
 * A marca é uma linha única por tenant: sem um tenant por caso, dois testes em
 * paralelo salvariam marca no mesmo registro e derrubariam um ao outro.
 *
 * Idempotente. Rodar com `npm run pre-setup`.
 */
describe("preSetup", () => {
	it("Garante os tenants dos casos de estado global", async function () {
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
		const created201 = preSetup.preSetupParamsDefault(
			201,
			5,
			500,
			platformParams.token,
		)

		const tenants = await getListTenants(read200)
		const plans = await getListPlans({}, read200)
		const activePlans = plans.json.filter(
			(plan: { isActive: boolean }) => plan.isActive,
		)

		const pool: Record<string, IPooledTenant> = {}

		for (const [caseId, purpose] of Object.entries(tenantAllocation)) {
			const slug = caseTenantSlug(caseId)
			const existing = tenants.json.filter(
				(tenant: { slug: string }) => tenant.slug === slug,
			)

			const tenantId: string = existing.length
				? existing[0].id
				: (
						await postCreateTenant(
							{
								name: `[${caseId}] ${purpose}`,
								slug,
								planId: activePlans[0].id,
								status: "active",
								contactEmail: `qa-${caseId.toLowerCase()}@example.com`,
							},
							created201,
						)
					).json.id

			const adminEmail = `qa-${caseId.toLowerCase()}@example.com`
			const admins = await getListAdmins(tenantId, read200)
			const existingAdmin = admins.json.filter(
				(admin: { email: string }) => admin.email === adminEmail,
			)

			const adminId: string = existingAdmin.length
				? existingAdmin[0].id
				: (
						await postCreateAdmin(
							tenantId,
							{
								name: `[${caseId}] admin`,
								email: adminEmail,
								password: caseTenantPassword,
							},
							created201,
						)
					).json.id

			await patchResetAdminPassword(
				tenantId,
				adminId,
				{ password: caseTenantPassword },
				read200,
			)

			pool[caseId] = {
				tenantId,
				slug,
				adminEmail,
				adminPassword: caseTenantPassword,
			}
		}

		writeFileSync(
			resolve(process.cwd(), caseTenantsFile),
			`${JSON.stringify(pool, null, 2)}\n`,
		)
	})
})
