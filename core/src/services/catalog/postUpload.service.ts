import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Envia a imagem de um produto
 * @param filePath - Caminho do arquivo enviado no campo `file` do multipart
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/products/uploads`
 */
export default async function postUpload(
	filePath: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardProducts}/uploads`)
			.withBearerToken(`${paramsDefault.token}`)
			.withFile("file", filePath)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/products/uploads não é o esperado.`,
			)
	)
}
