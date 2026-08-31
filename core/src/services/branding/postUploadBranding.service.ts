import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Envia logo ou capa diretamente
 * @param filePath - Caminho do arquivo enviado no campo `file` do multipart
 * @param kind - Campo `kind` do multipart
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/branding/uploads`
 */
export default async function postUploadBranding(
	filePath: string,
	kind: "logo" | "cover",
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardBranding}/uploads`)
			.withBearerToken(`${paramsDefault.token}`)
			.withFile("file", filePath)
			.withMultiPartFormData("kind", kind)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/branding/uploads não é o esperado.`,
			)
	)
}
