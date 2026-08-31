import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Envia a foto de uma pessoa
 * @param personId - personId
 * @param filePath - Caminho do arquivo enviado no campo `file` do multipart
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `POST /dashboard/people/{personId}/photo`
 */
export default async function postUploadPhoto(
	personId: string,
	filePath: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.post(`${process.env.BASE_URL}${apiName.dashboardPeople}/${personId}/photo`)
			.withBearerToken(`${paramsDefault.token}`)
			.withFile("file", filePath)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição POST /dashboard/people/{personId}/photo não é o esperado.`,
			)
	)
}
