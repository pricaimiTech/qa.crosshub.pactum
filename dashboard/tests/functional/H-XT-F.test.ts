import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getHome from "@core/services/dashboard/getHome.service"
import { emptyTenantFile } from "@shared-data/tenants.data"
import { homeHXT } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let busyTenantParams: IParamsDefault
	let emptyTenantParams: IParamsDefault

	before("Um tenant com volume e outro sem nenhum dado", async () => {
		busyTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			homeHXT.loginParams,
		)

		const emptyTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), emptyTenantFile), "utf8"),
		)

		emptyTenantParams = await authBusiness.loginAsTenantAdmin(
			emptyTenant.slug,
			emptyTenant.adminEmail,
			emptyTenant.adminPassword,
			homeHXT.loginParams,
		)
	})

	it("[H-XT-F] - Cada tenant vê só o próprio número: o vazio não herda o volume do vizinho", async () => {
		const comVolume = await getHome(
			homeHXT.paramsDefault200(busyTenantParams.token),
		)
		const vazio = await getHome(
			homeHXT.paramsDefault200(emptyTenantParams.token),
		)

		assertTs.isAbove(
			comVolume.json.metrics.newPeopleLast7Days,
			0,
			"O tenant de testes deveria ter cadastros recentes — sem isso o caso não prova nada.",
		)

		assertTs.equal(
			vazio.json.metrics.newPeopleLast7Days,
			0,
			"O tenant vazio contou cadastros do tenant vizinho.",
		)

		assertTs.equal(
			vazio.json.metrics.newFormSubmissions,
			0,
			"O tenant vazio contou respostas de formulário do tenant vizinho.",
		)
	})
})
