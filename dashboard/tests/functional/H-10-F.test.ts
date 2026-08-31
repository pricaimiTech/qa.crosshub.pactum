import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getHome from "@core/services/dashboard/getHome.service"
import { emptyTenantFile } from "@shared-data/tenants.data"
import { homeH10 } from "@dashboard-data/home.data"

describe(describeName.dashboard, () => {
	let emptyTenantParams: IParamsDefault

	before("Tenant sem nenhum dado", async () => {
		const emptyTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), emptyTenantFile), "utf8"),
		)

		emptyTenantParams = await authBusiness.loginAsTenantAdmin(
			emptyTenant.slug,
			emptyTenant.adminEmail,
			emptyTenant.adminPassword,
			homeH10.loginParams,
		)
	})

	it("[H-10-F] - Tenant sem dados devolve métricas zeradas e listas vazias, sem exemplo embutido", async () => {
		const { json } = await getHome(
			homeH10.paramsDefault200(emptyTenantParams.token),
		)

		const naoZeradas = homeH10.zeroedMetrics.filter(
			(metrica) => json.metrics[metrica] !== 0,
		)

		assertTs.deepEqual(
			naoZeradas,
			[],
			"Alguma métrica veio diferente de zero em um tenant sem nenhum dado.",
		)

		assertTs.lengthOf(
			json.actions,
			0,
			"A Home de um tenant vazio ofereceu ações.",
		)

		assertTs.lengthOf(
			json.activities,
			0,
			"A Home de um tenant vazio trouxe eventos no feed — provável dado de exemplo.",
		)

		assertTs.lengthOf(
			json.alerts.items,
			0,
			"A Home de um tenant vazio trouxe alertas.",
		)
	})
})
