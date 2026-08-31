import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IUpdateBanner } from "../../interface/banners/IBanners.interface"

/**
 * Atualiza um banner
 * @param id - id
 * @param payload - Corpo da requisição
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `PATCH /dashboard/banners/{id}`
 */
export default async function patchUpdateBanner(
	id: string,
	payload: IUpdateBanner,
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.patch(`${process.env.BASE_URL}${apiName.dashboardBanners}/${id}`)
			.withBearerToken(`${paramsDefault.token}`)
			.withJson(payload)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição PATCH /dashboard/banners/{id} não é o esperado.`,
			)
	)
}
