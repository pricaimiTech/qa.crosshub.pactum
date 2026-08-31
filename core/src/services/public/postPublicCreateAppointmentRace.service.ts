import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { ICreateClientAppointment } from "../../interface/public/IPublic.interface"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Cria um agendamento pelo app **sem assertar o status**.
 *
 * Existe só para o caso `AG-16`, onde duas requisições disputam a última vaga:
 * qualquer uma pode ganhar, então fixar o status esperado derrubaria a
 * requisição perdedora antes de o teste poder conferir o par 201/409.
 *
 * Fora dessa disputa, use `postPublicCreateAppointment`.
 * @param payload - Corpo da reserva
 * @param paramsDefault - Parâmetros padrão da requisição; só o token é usado,
 * porque o status não é assertado aqui — quem decide o que é sucesso é o teste
 * @rota POST /public/appointments
 * @returns Resposta bruta, para o chamador ler `statusCode`
 */
export default async function postPublicCreateAppointmentRace(
	payload: ICreateClientAppointment,
	paramsDefault: IParamsDefault,
) {
	return await specPactumJs()
		.post(`${process.env.BASE_URL}${apiName.publicAppointments}`)
		.withBearerToken(`${paramsDefault.token}`)
		.withJson(payload)
		.retry({ count: 0, delay: 0, strategy: () => true })
}
