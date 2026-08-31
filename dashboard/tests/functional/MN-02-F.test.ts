import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getSession from "@core/services/dashboard/getSession.service"
import patchSetAdminStatus from "@core/services/tenants/patchSetAdminStatus.service"
import { adminFor } from "@core/utils/admin.utils"
import { adminsFile } from "@shared-data/admins.data"
import { menuMN02 } from "@dashboard-data/menu.data"

describe(describeName.dashboard, () => {
	let platformParams: IParamsDefault
	let victimToken: string
	let tenantId: string
	let victimAdminId: string

	before("Admin com sessão aberta, prestes a ser desativado", async () => {
		platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			menuMN02.loginParams,
		)

		const pool = JSON.parse(
			readFileSync(resolve(process.cwd(), adminsFile), "utf8"),
		)

		tenantId = pool.tenantId

		const victim = adminFor(menuMN02.caseId)
		victimAdminId = victim.adminId

		// Garante o estado inicial: a execução anterior pode ter deixado inativo.
		await patchSetAdminStatus(
			tenantId,
			victimAdminId,
			{ isActive: true },
			menuMN02.paramsDefault200(platformParams.token),
		)

		const victimParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			victim.email,
			victim.password,
			menuMN02.loginParams,
		)

		victimToken = `${victimParams.token}`
	})

	after("Reativa o admin usado no caso", async () => {
		await patchSetAdminStatus(
			tenantId,
			victimAdminId,
			{ isActive: true },
			menuMN02.paramsDefault200(platformParams.token),
		)
	})

	it("[MN-02-F] - Token adulterado é recusado, e desativar o admin invalida a sessão já aberta", async () => {
		await getSession(menuMN02.paramsDefault401(menuMN02.tamperedToken))

		// O token continua válido e no prazo; só o admin muda de estado.
		await patchSetAdminStatus(
			tenantId,
			victimAdminId,
			{ isActive: false },
			menuMN02.paramsDefault200(platformParams.token),
		)

		const { json } = await getSession(menuMN02.paramsDefault401(victimToken))

		assertTs.equal(
			json.statusCode,
			401,
			"O token de um admin desativado continuou funcionando — `isActive` não está sendo reconferido a cada requisição.",
		)
	})
})
