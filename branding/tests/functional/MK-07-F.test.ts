import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postUploadBranding from "@core/services/branding/postUploadBranding.service"
import { writeJpeg, writePdf } from "@core/utils/file.utils"
import { brandingMK07 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			brandingMK07.loginParams,
		)
	})

	it("[MK-07-F] - Tipo fora do permitido e arquivo acima de 5 MB são recusados no upload da marca", async () => {
		const tipoInvalido = await postUploadBranding(
			writePdf("marca.pdf"),
			brandingMK07.kind,
			brandingMK07.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(tipoInvalido.json.message),
			brandingMK07.errorMessage,
			"O arquivo de tipo não permitido não foi recusado com a mensagem especificada.",
		)

		await postUploadBranding(
			writeJpeg("marca-grande.jpg", brandingMK07.oversizedBytes),
			brandingMK07.kind,
			brandingMK07.paramsDefault413(adminParams.token),
		)

		const aceito = await postUploadBranding(
			writeJpeg("marca-valida.jpg", brandingMK07.acceptedBytes),
			brandingMK07.kind,
			brandingMK07.paramsDefault201(adminParams.token),
		)

		assertTs.exists(
			aceito.json.key,
			"O upload aceito não devolveu a chave do ativo.",
		)

		assertTs.exists(
			aceito.json.publicUrl,
			"O upload aceito não devolveu a URL pública do ativo.",
		)
	})
})
