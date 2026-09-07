import { assertTs, authBusiness, describeName, privacyBusiness } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getList from "@core/services/audit/getList.service"
import { adminFor } from "@core/utils/admin.utils"
import { privacyLGPD13 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault
	let targetAdminId: string

	before("Administrador Principal autenticado; admin alvo reservado ao caso", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD13.loginParams,
		)

		targetAdminId = adminFor(privacyLGPD13.caseId).adminId
	})

	it("[LGPD-13-F] - Conceder e revogar o acesso deixam dois eventos na trilha, com ator, alvo e o valor aplicado", async () => {
		const antes = await getList(
			{ action: privacyLGPD13.action, entityId: targetAdminId },
			privacyLGPD13.paramsDefault200(primaryParams.token),
		)

		await privacyBusiness.setSensitiveAccess(
			targetAdminId,
			true,
			privacyLGPD13.paramsDefault200(primaryParams.token),
		)
		await privacyBusiness.setSensitiveAccess(
			targetAdminId,
			false,
			privacyLGPD13.paramsDefault200(primaryParams.token),
		)

		const depois = await getList(
			{ action: privacyLGPD13.action, entityId: targetAdminId },
			privacyLGPD13.paramsDefault200(primaryParams.token),
		)

		assertTs.equal(
			depois.json.total - antes.json.total,
			2,
			"Conceder e revogar não deixaram exatamente dois eventos na trilha.",
		)

		const [revogacao, concessao] = depois.json.items

		assertTs.equal(concessao.entityId, targetAdminId, "O evento de concessão não aponta para o admin alvo.")
		assertTs.exists(concessao.actorUserId, "O evento de concessão não identifica quem concedeu.")
		assertTs.notEqual(
			JSON.stringify(concessao.metadata),
			JSON.stringify(revogacao.metadata),
			"Os dois eventos têm o mesmo metadado — o valor aplicado não foi registrado.",
		)
	})
})
