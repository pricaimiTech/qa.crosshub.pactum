import {
	addonsBusiness,
	assertTs,
	authBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import type { ISessionAddOn } from "@core/interfaces/dashboard/IDashboard.interface"
import getSession from "@core/services/dashboard/getSession.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { analyticsANL01 } from "@analytics-data/analytics.data"

describe(describeName.dashboard, () => {
	const tenant = tenantFor(analyticsANL01.caseId)
	let platformParams: IParamsDefault
	let adminParams: IParamsDefault

	before("Super admin e admin do tenant reservado ao caso", async () => {
		// O add-on é linha única por tenant: este caso liga e desliga no seu
		// próprio tenant para não derrubar os vizinhos que dependem dele ativo.
		platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			analyticsANL01.loginParams,
		)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			analyticsANL01.loginParams,
		)
	})

	it("[ANL-01-F] - A sessão declara o add-on Analytics só quando ele está ativo, e sempre lista os módulos", async () => {
		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL01.addOnCode,
			"inactive",
			platformParams,
		)
		const without = await getSession(
			analyticsANL01.paramsDefault200(adminParams.token),
		)

		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL01.addOnCode,
			"active",
			platformParams,
		)
		const withAddOn = await getSession(
			analyticsANL01.paramsDefault200(adminParams.token),
		)

		const analyticsBefore = (without.json.addons as Array<ISessionAddOn>).filter(
			(addOn) => addOn.code === analyticsANL01.addOnCode,
		)
		const analyticsAfter = (withAddOn.json.addons as Array<ISessionAddOn>).filter(
			(addOn) => addOn.code === analyticsANL01.addOnCode,
		)

		assertTs.isArray(
			without.json.enabledModules,
			"A sessão sem o add-on não devolveu a lista de módulos habilitados.",
		)
		assertTs.equal(
			analyticsBefore.length,
			0,
			"A sessão listou o add-on Analytics com ele inativo.",
		)
		assertTs.equal(
			analyticsAfter.length,
			1,
			"A sessão não listou o add-on Analytics depois de ativá-lo.",
		)
		assertTs.equal(
			analyticsAfter[0].status,
			"active",
			"O status do add-on Analytics na sessão não é `active`.",
		)
		assertTs.isNull(
			analyticsAfter[0].endsAt,
			"Um add-on ativo sem vencimento não deveria ter `endsAt`.",
		)
		assertTs.deepEqual(
			withAddOn.json.enabledModules,
			without.json.enabledModules,
			"Ativar o add-on mudou a lista de módulos do plano, que é independente dele.",
		)
	})
})
