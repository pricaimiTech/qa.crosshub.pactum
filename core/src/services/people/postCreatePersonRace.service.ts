import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { ICreatePerson } from "../../interface/people/IPeople.interface"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Cadastra um cliente **sem assertar o status**.
 *
 * Existe só para o caso `C-18`, onde duas requisições com o mesmo e-mail
 * partem ao mesmo tempo: qualquer uma pode ganhar, então fixar o status
 * esperado derrubaria a perdedora antes de o teste poder conferir o par
 * 201/409.
 *
 * Fora dessa disputa, use `postCreatePerson`.
 * @param payload - Corpo do cadastro
 * @param paramsDefault - Parâmetros padrão da requisição; só o token é usado,
 * porque o status não é assertado aqui — quem decide o que é sucesso é o teste
 * @rota POST /dashboard/people
 * @returns Resposta bruta, para o chamador ler `statusCode`
 */
export default async function postCreatePersonRace(
	payload: ICreatePerson,
	paramsDefault: IParamsDefault,
) {
	return await specPactumJs()
		.post(`${process.env.BASE_URL}${apiName.dashboardPeople}`)
		.withBearerToken(`${paramsDefault.token}`)
		.withJson(payload)
		.retry({ count: 0, delay: 0, strategy: () => true })
}
