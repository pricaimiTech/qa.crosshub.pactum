import {
	assertTs,
	authBusiness,
	describeName,
	privacyBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchSensitiveDataAccess from "@core/services/privacy/patchSensitiveDataAccess.service"
import { adminFor } from "@core/utils/admin.utils"
import { privacyLGPD03 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let grantorParams: IParamsDefault
	let targetAdminId: string

	before("Admin comum já autorizado, e um terceiro admin como alvo", async () => {
		const primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD03.loginParams,
		)

		const grantor = adminFor("LGPD-03")
		const target = adminFor("LGPD-03-alvo")

		targetAdminId = target.adminId

		// Quem tenta conceder está ele próprio autorizado — o caso prova que ter
		// acesso não dá o direito de distribuí-lo.
		await privacyBusiness.setSensitiveAccess(
			grantor.adminId,
			true,
			primaryParams,
		)
		await privacyBusiness.setSensitiveAccess(targetAdminId, false, primaryParams)

		grantorParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			grantor.email,
			grantor.password,
			privacyLGPD03.loginParams,
		)
	})

	it("[LGPD-03-F] - Admin autorizado que não é o Principal não consegue conceder acesso a outro", async () => {
		const { json } = await patchSensitiveDataAccess(
			targetAdminId,
			{ allowed: true },
			privacyLGPD03.paramsDefault403(grantorParams.token),
		)

		assertTs.equal(
			json.message,
			privacyLGPD03.errorMessage,
			"A recusa da concessão por admin não Principal não trouxe a mensagem especificada.",
		)
	})
})
