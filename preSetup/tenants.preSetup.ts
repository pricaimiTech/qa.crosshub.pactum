import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { authBusiness, preSetup } from "@core/constants"
import getListTenants from "@core/services/tenants/getListTenants.service"
import getListPlans from "@core/services/plans/getListPlans.service"
import getListAdmins from "@core/services/tenants/getListAdmins.service"
import patchResetAdminPassword from "@core/services/tenants/patchResetAdminPassword.service"
import postCreateAdmin from "@core/services/tenants/postCreateAdmin.service"
import postCreateTenant from "@core/services/tenants/postCreateTenant.service"
import {
	secondTenant,
	secondTenantExtraAdmin,
	secondTenantFile,
} from "@shared-data/tenants.data"

/**
 * Garante a existência do segundo tenant usado pelos casos de isolamento.
 *
 * Idempotente: reaproveita o tenant quando o slug já existe e redefine a senha
 * do admin de QA, para que a suíte funcione mesmo depois de perder o arquivo
 * local de credenciais.
 *
 * Rodar com `npm run pre-setup`.
 */
describe("preSetup", () => {
	it("Garante o segundo tenant para os casos de isolamento", async function () {
		this.timeout(120000)

		const platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			preSetup.preSetupParamsDefault(200, 5, 500),
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
			(tenant: { slug: string }) => tenant.slug === secondTenant.slug,
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
							name: secondTenant.name,
							slug: secondTenant.slug,
							planId: activePlans[0].id,
							status: "active",
							contactEmail: secondTenant.contactEmail,
						},
						created201,
					)
				).json.id

		const admins = await getListAdmins(tenantId, read200)
		const qaAdmin = admins.json.filter(
			(admin: { email: string }) => admin.email === secondTenant.adminEmail,
		)

		const adminId: string = qaAdmin.length
			? qaAdmin[0].id
			: (
					await postCreateAdmin(
						tenantId,
						{
							name: secondTenant.adminName,
							email: secondTenant.adminEmail,
							password: secondTenant.adminPassword,
						},
						created201,
					)
				).json.id

		await patchResetAdminPassword(
			tenantId,
			adminId,
			{ password: secondTenant.adminPassword },
			read200,
		)

		// Segundo admin do tenant: o caso LGPD-01 compara com o primeiro.
		const extra = admins.json.filter(
			(admin: { email: string }) =>
				admin.email === secondTenantExtraAdmin.email,
		)

		const extraAdminId: string = extra.length
			? extra[0].id
			: (
					await postCreateAdmin(
						tenantId,
						{
							name: secondTenantExtraAdmin.name,
							email: secondTenantExtraAdmin.email,
							password: secondTenantExtraAdmin.password,
						},
						created201,
					)
				).json.id

		await patchResetAdminPassword(
			tenantId,
			extraAdminId,
			{ password: secondTenantExtraAdmin.password },
			read200,
		)

		writeFileSync(
			resolve(process.cwd(), secondTenantFile),
			`${JSON.stringify(
				{ tenantId, adminId, extraAdminId, ...secondTenant },
				null,
				2,
			)}\n`,
		)
	})
})
