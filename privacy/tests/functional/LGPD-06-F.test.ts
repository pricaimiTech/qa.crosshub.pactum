import {
	assertTs,
	authBusiness,
	describeName,
	privacyBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchSensitiveDataAccess from "@core/services/privacy/patchSensitiveDataAccess.service"
import { privacyLGPD06 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let primaryAdminId: string

	before("Administrador Principal autenticado", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD06.loginParams,
		)

		const professionals = await privacyBusiness.professionals(
			privacyLGPD06.paramsDefault200(primaryParams.token),
		)

		primaryAdminId = professionals.filter(
			(professional) => professional.isPrimaryAdmin,
		)[0].id
	})

	it("[LGPD-06-F] - O Administrador Principal não consegue revogar o próprio acesso a dados sensíveis", async () => {
		const { json } = await patchSensitiveDataAccess(
			primaryAdminId,
			{ allowed: false },
			privacyLGPD06.paramsDefault409(primaryParams.token),
		)

		assertTs.equal(
			json.message,
			privacyLGPD06.errorMessage,
			"A recusa da revogação do Principal não trouxe a mensagem especificada.",
		)

		const depois = await privacyBusiness.professionalById(
			primaryAdminId,
			privacyLGPD06.paramsDefault200(primaryParams.token),
		)

		assertTs.isTrue(
			depois.canViewSensitiveData,
			"O acesso do Administrador Principal foi revogado apesar da recusa.",
		)
	})
})
