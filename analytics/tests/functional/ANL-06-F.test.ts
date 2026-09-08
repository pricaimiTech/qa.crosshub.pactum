import {
	addonsBusiness,
	assertTs,
	authBusiness,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import type { IAddOnInterest } from "@core/interfaces/analytics/IAnalytics.interface"
import postRequestAnalyticsInterest from "@core/services/analytics/postRequestAnalyticsInterest.service"
import getTenantAddOnInterests from "@core/services/addons/getTenantAddOnInterests.service"
import getPendingInterests from "@core/services/addons/getPendingInterests.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { analyticsANL06 } from "@analytics-data/analytics.data"

describe(describeName.admin, () => {
	const tenant = tenantFor(analyticsANL06.caseId)
	let platformParams: IParamsDefault
	let adminParams: IParamsDefault

	before("Tenant sem o add-on e sem pedido pendente", async () => {
		platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			analyticsANL06.loginParams,
		)

		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL06.addOnCode,
			"active",
			platformParams,
		)
		await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL06.addOnCode,
			"inactive",
			platformParams,
		)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			analyticsANL06.loginParams,
		)
	})

	it("[ANL-06-F] - Ativar o add-on pelo admin da plataforma atende o pedido de interesse pendente", async () => {
		const request = await postRequestAnalyticsInterest(
			{ kind: analyticsANL06.kind },
			analyticsANL06.paramsDefault201(adminParams.token),
		)
		const beforeActivation = await getTenantAddOnInterests(
			tenant.tenantId,
			analyticsANL06.paramsDefault200(platformParams.token),
		)

		// Sino e Visão geral do Super Admin leem a lista global, com nome e slug da organização.
		const globalBefore = await getPendingInterests(
			analyticsANL06.paramsDefault200(platformParams.token),
		)
		const mineBefore = (globalBefore.json as Array<IAddOnInterest & { tenantSlug: string; tenantName: string }>).filter(
			(interest) => interest.id === request.json.id,
		)
		assertTs.equal(
			mineBefore.length,
			1,
			"O pedido não apareceu na lista global de pendentes do admin da plataforma.",
		)
		assertTs.equal(
			mineBefore[0].tenantSlug,
			tenant.slug,
			"A lista global não trouxe o slug da organização que pediu.",
		)

		const tenantAddOn = await addonsBusiness.setAddOnStatus(
			tenant.tenantId,
			analyticsANL06.addOnCode,
			"active",
			platformParams,
		)
		const afterActivation = await getTenantAddOnInterests(
			tenant.tenantId,
			analyticsANL06.paramsDefault200(platformParams.token),
		)

		const pendingBefore = (beforeActivation.json as Array<IAddOnInterest>).filter(
			(interest) => interest.id === request.json.id,
		)

		assertTs.equal(
			pendingBefore.length,
			1,
			"O pedido recém-criado não apareceu como pendente para o admin da plataforma.",
		)
		assertTs.equal(
			tenantAddOn.status,
			"active",
			"O add-on não ficou ativo depois do PUT.",
		)
		assertTs.deepEqual(
			afterActivation.json,
			[],
			"Ativar o add-on deveria ter atendido o pedido pendente, mas ele continua listado.",
		)

		const globalAfter = await getPendingInterests(
			analyticsANL06.paramsDefault200(platformParams.token),
		)
		assertTs.equal(
			(globalAfter.json as Array<IAddOnInterest>).filter((interest) => interest.id === request.json.id).length,
			0,
			"O pedido atendido continua na lista global do sino.",
		)
	})
})
