import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postUpload from "@core/services/catalog/postUpload.service"
import { writeJpeg, writePdf } from "@core/utils/file.utils"
import { catalogCAT08 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT08.loginParams,
		)
	})

	it("[CAT-08-F] - PDF e imagem acima de 5 MB são recusados; imagem válida devolve chave e URL", async () => {
		const pdf = await postUpload(
			writePdf("produto.pdf"),
			catalogCAT08.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(pdf.json.message),
			catalogCAT08.errorMessage,
			"O PDF não foi recusado com a mensagem especificada.",
		)

		await postUpload(
			writeJpeg("produto-grande.jpg", catalogCAT08.oversizedBytes),
			catalogCAT08.paramsDefault413(adminParams.token),
		)

		const aceito = await postUpload(
			writeJpeg("produto-valido.jpg", catalogCAT08.acceptedBytes),
			catalogCAT08.paramsDefault201(adminParams.token),
		)

		assertTs.exists(
			aceito.json.key,
			"O upload aceito não devolveu a chave da imagem.",
		)

		assertTs.exists(
			aceito.json.publicUrl,
			"O upload aceito não devolveu a URL pública da imagem.",
		)
	})
})
