import {
	assertTs,
	authBusiness,
	describeName,
	privacyBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postRunRetention from "@core/services/privacy/postRunRetention.service"
import { adminFor } from "@core/utils/admin.utils"
import { privacyLGPD12 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let restrictedParams: IParamsDefault

	before("Admin sem autorização de leitura sensível", async () => {
		const primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD12.loginParams,
		)

		const restricted = adminFor("LGPD-12")

		await privacyBusiness.setSensitiveAccess(
			restricted.adminId,
			false,
			primaryParams,
		)

		restrictedParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			restricted.email,
			restricted.password,
			privacyLGPD12.loginParams,
		)
	})

	it("[LGPD-12-F] - Admin sem autorização de leitura ainda dispara a retenção", async () => {
		const { json } = await postRunRetention(
			privacyLGPD12.paramsDefault201(restrictedParams.token),
		)

		assertTs.isNumber(
			json.deletedSubmissions,
			"A retenção não devolveu o total de respostas apagadas — apagar e ler deveriam ser controles independentes.",
		)
	})
})
