import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postUploadBranding from "@core/services/branding/postUploadBranding.service"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { writeJpeg } from "@core/utils/file.utils"
import { secondTenantFile } from "@shared-data/tenants.data"
import { brandingMK06 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let firstTenantParams: IParamsDefault
	let foreignLogoKey: string

	before("Logo enviada no tenant B", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			brandingMK06.loginParams,
		)

		const upload = await postUploadBranding(
			writeJpeg("marca-do-tenant-b.jpg", brandingMK06.logoBytes),
			brandingMK06.kind,
			brandingMK06.paramsDefault201(secondTenantParams.token),
		)

		foreignLogoKey = upload.json.key

		firstTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			brandingMK06.loginParams,
		)
	})

	it("[MK-06-F] - Chave de ativo do outro tenant é recusada na marca", async () => {
		const { json } = await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK06.casePrefix)
				.withLogoKey(foreignLogoKey)
				.build(),
			brandingMK06.paramsDefault400(firstTenantParams.token),
		)

		assertTs.equal(
			json.statusCode,
			400,
			"Uma chave do espaço de nomes do tenant B foi aceita na marca do tenant A.",
		)
	})
})
