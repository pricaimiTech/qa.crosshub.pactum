import { specPactumJs } from "../../constants"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Chama uma rota que **não existe** no contrato, para provar que ela continua
 * não existindo.
 *
 * Anonimização e exclusão física de pessoa foram deixadas de fora do produto de
 * propósito. Como são operações irreversíveis, o caso `AN-01` guarda a decisão:
 * se alguma dessas rotas aparecer, o teste fica vermelho e a reintrodução vira
 * decisão consciente, não acidente de rotina.
 *
 * Escrita à mão porque o gerador só produz o que está no `openapi.json` — e o
 * ponto aqui é justamente a ausência.
 * @param method - Verbo HTTP da rota candidata
 * @param path - Caminho já com os parâmetros substituídos
 * @param paramsDefault - Parâmetros padrão da requisição
 * @rotaAusente POST /dashboard/privacy/people/{personId}/anonymization-requests
 * @returns Resposta da rota ausente, esperada como 404
 */
export default async function postAnonymizationRequest(
	method: "post" | "delete",
	path: string,
	paramsDefault: IParamsDefault,
) {
	const spec = specPactumJs()
	const url = `${process.env.BASE_URL}${path}`

	return await (method === "post" ? spec.post(url) : spec.delete(url))
		.withBearerToken(`${paramsDefault.token}`)
		.expectStatus(
			paramsDefault.statusCode,
			`A rota ${method.toUpperCase()} ${path} respondeu algo diferente de 404 — ela pode ter sido reintroduzida.`,
		)
}
