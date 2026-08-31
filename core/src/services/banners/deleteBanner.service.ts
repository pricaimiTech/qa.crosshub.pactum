import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Remove um banner e sua imagem
 * @param id - id
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `DELETE /dashboard/banners/{id}`
 */
export default async function deleteBanner(
	id: string,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.delete(`${process.env.BASE_URL}${apiName.dashboardBanners}/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição DELETE /dashboard/banners/{id} não é o esperado.`,
			)
	)
}
