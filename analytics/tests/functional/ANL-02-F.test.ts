import {
	addonsBusiness,
	assertTs,
	authBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import type { IAddOnInterest } from "@core/interfaces/analytics/IAnalytics.interface"
import getPendingAnalyticsInterest from "@core/services/analytics/getPendingAnalyticsInterest.service"
import postRequestAnalyticsInterest from "@core/services/analytics/postRequestAnalyticsInterest.service"
import getTenantAddOnInterests from "@core/services/addons/getTenantAddOnInterests.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { analyticsANL02 } from "@analytics-data/analytics.data"

describe(describeName.dashboard, () => {
	const tenant = tenantFor(analyticsANL02.caseId)
	let platformParams: IParamsDefault
	let adminParams: IParamsDefault

	before("Tenant sem o add-on e sem pedido pendente", async () => {
		platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			analyticsANL02.loginParams,
		)

		// Ativar atende o pedido pendente da execução anterior; desativar volta o
		// tenant ao estado que o caso exige. Sem isso, o primeiro POST já viria 200.
		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL02.addOnCode,
			"active",
			platformParams,
		)
		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL02.addOnCode,
			"inactive",
			platformParams,
		)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			analyticsANL02.loginParams,
		)
	})

	it("[ANL-02-F] - O segundo pedido de interesse em 7 dias reaproveita o primeiro, e o admin da plataforma o enxerga pendente", async () => {
		const first = await postRequestAnalyticsInterest(
			{ kind: analyticsANL02.kind },
			analyticsANL02.paramsDefault201(adminParams.token),
		)
		const second = await postRequestAnalyticsInterest(
			{ kind: analyticsANL02.kind },
			analyticsANL02.paramsDefault200(adminParams.token),
		)
		const pending = await getPendingAnalyticsInterest(
			analyticsANL02.paramsDefault200(adminParams.token),
		)
		const adminList = await getTenantAddOnInterests(
			tenant.tenantId,
			analyticsANL02.paramsDefault200(platformParams.token),
		)

		const listed = (adminList.json as Array<IAddOnInterest>).filter(
			(interest) => interest.id === first.json.id,
		)

		assertTs.isFalse(
			first.json.reused,
			"O primeiro pedido não deveria vir marcado como reaproveitado.",
		)
		assertTs.equal(
			first.json.status,
			"pending",
			"O pedido recém-criado não nasceu `pending`.",
		)
		assertTs.equal(
			second.json.id,
			first.json.id,
			"O segundo pedido em 7 dias criou um registro novo em vez de reaproveitar o primeiro.",
		)
		assertTs.isTrue(
			second.json.reused,
			"O segundo pedido não veio marcado como reaproveitado.",
		)
		assertTs.equal(
			pending.json.pending.id,
			first.json.id,
			"A consulta de pendência não devolveu o pedido criado.",
		)
		assertTs.equal(
			pending.json.addon.code,
			analyticsANL02.addOnCode,
			"A consulta de pendência não trouxe o add-on do catálogo.",
		)
		assertTs.equal(
			listed.length,
			1,
			"O admin da plataforma não enxerga o pedido pendente do tenant.",
		)
		assertTs.equal(
			listed[0].kind,
			analyticsANL02.kind,
			"O tipo do pedido listado para o admin difere do enviado.",
		)
		assertTs.equal(
			listed[0].requestedByEmail,
			tenant.adminEmail,
			"O pedido não registrou o e-mail da administradora que o fez.",
		)
	})
})
