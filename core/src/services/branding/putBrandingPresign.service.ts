import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IPresignUpload } from "../../interface/branding/IBranding.interface"

/**
 * Assina uma URL para envio de logo ou capa
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PUT /dashboard/branding/uploads/presign`
 */
export default async function putBrandingPresign(
	payload: IPresignUpload,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.put(`${process.env.BASE_URL}${apiName.dashboardBranding}/uploads/presign`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PUT /dashboard/branding/uploads/presign não é o esperado.`,
			)
	)
}
