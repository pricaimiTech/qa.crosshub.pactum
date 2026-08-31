import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Envia a imagem de um banner
 * @param filePath - Caminho do arquivo enviado no campo `file` do multipart
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/banners/uploads`
 */
export default async function postUploadBanner(
	filePath: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardBanners}/uploads`)
			.withBearerToken(`${paramsDefault.token}`)
			.withFile("file", filePath)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/banners/uploads não é o esperado.`,
			)
	)
}
