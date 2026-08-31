import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Verifica a disponibilidade da API
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta de `GET /health`
 */
export default async function getHealth(
	paramsDefault: IParamsDefault,
) {
	return await (
		specPactumJs()
			.get(`${process.env.BASE_URL}${apiName.health}`)
			.expectStatus(
				paramsDefault.statusCode,
				`O status code da requisição GET /health não é o esperado.`,
			)
			.retry({
				count: paramsDefault.retry.count,
				delay: paramsDefault.retry.delay,
				strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
			})
	)
}
