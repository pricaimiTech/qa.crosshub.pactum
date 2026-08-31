import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getBranding from "@core/services/branding/getBranding.service"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { brandingMKXT } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let firstTenantParams: IParamsDefault
	let secondTenantParams: IParamsDefault

	before("Marca salva nos dois tenants, com cores diferentes", async () => {
		firstTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			brandingMKXT.loginParams,
		)

		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			brandingMKXT.loginParams,
		)

		await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMKXT.casePrefix)
				.withAccentColor(brandingMKXT.secondTenantColor)
				.build(),
			brandingMKXT.paramsDefault200(secondTenantParams.token),
		)

		await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMKXT.casePrefix)
				.withAccentColor(brandingMKXT.firstTenantColor)
				.build(),
			brandingMKXT.paramsDefault200(firstTenantParams.token),
		)
	})

	it("[MK-XT-F] - Cada tenant lê a própria marca, nunca a do vizinho", async () => {
		const primeiro = await getBranding(
			brandingMKXT.paramsDefault200(firstTenantParams.token),
		)
		const segundo = await getBranding(
			brandingMKXT.paramsDefault200(secondTenantParams.token),
		)

		assertTs.equal(
			primeiro.json.accentColor,
			brandingMKXT.firstTenantColor,
			"O tenant A não leu a própria cor de destaque.",
		)

		assertTs.equal(
			segundo.json.accentColor,
			brandingMKXT.secondTenantColor,
			"A marca do tenant B foi sobrescrita pela escrita do tenant A.",
		)
	})
})
