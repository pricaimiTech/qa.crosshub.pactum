import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { authBusiness, preSetup } from "@core/constants"
import getListAdmins from "@core/services/tenants/getListAdmins.service"
import getListPlans from "@core/services/plans/getListPlans.service"
import getListTenants from "@core/services/tenants/getListTenants.service"
import patchResetAdminPassword from "@core/services/tenants/patchResetAdminPassword.service"
import postCreateAdmin from "@core/services/tenants/postCreateAdmin.service"
import postCreateTenant from "@core/services/tenants/postCreateTenant.service"
import { emptyTenant, emptyTenantFile } from "@shared-data/tenants.data"

/**
 * Garante um tenant que **nunca recebe massa**.
 *
 * É o único jeito de provar que a Home de um tenant novo vem zerada (`H-10`) —
 * o tenant de testes e o de isolamento acumulam dado a cada execução.
 *
 * Idempotente. Rodar com `npm run pre-setup`.
 */
describe("preSetup", () => {
	it("Garante o tenant vazio para o caso da Home sem dados", async function () {
		this.timeout(120000)

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
		const existing = tenants.json.filter(
			(tenant: { slug: string }) => tenant.slug === emptyTenant.slug,
		)

		const plans = await getListPlans({}, read200)
		const activePlans = plans.json.filter(
			(plan: { isActive: boolean }) => plan.isActive,
		)

		const tenantId: string = existing.length
			? existing[0].id
			: (
					await postCreateTenant(
						{
							name: emptyTenant.name,
							slug: emptyTenant.slug,
							planId: activePlans[0].id,
							status: "active",
							contactEmail: emptyTenant.contactEmail,
						},
						created201,
					)
				).json.id

		const admins = await getListAdmins(tenantId, read200)
		const qaAdmin = admins.json.filter(
			(admin: { email: string }) => admin.email === emptyTenant.adminEmail,
		)

		const adminId: string = qaAdmin.length
			? qaAdmin[0].id
			: (
					await postCreateAdmin(
						tenantId,
						{
							name: emptyTenant.adminName,
							email: emptyTenant.adminEmail,
							password: emptyTenant.adminPassword,
						},
						created201,
					)
				).json.id

		await patchResetAdminPassword(
			tenantId,
			adminId,
			{ password: emptyTenant.adminPassword },
			read200,
		)

		writeFileSync(
			resolve(process.cwd(), emptyTenantFile),
			`${JSON.stringify({ tenantId, adminId, ...emptyTenant }, null, 2)}\n`,
		)
	})
})
