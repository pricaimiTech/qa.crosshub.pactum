import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Reagendamento pelo cliente final — **rota documentada na especificação do
 * produto, mas ausente do controller e do `openapi.json`**.
 *
 * Existe só para o caso `AG-22` conseguir provar a ausência: a chamada devolve
 * 404 e o teste congela a divergência entre especificação e código. Escrito à
 * mão de propósito; o gerador não a produz porque ela não está no contrato.
 * @param appointmentId - Id do agendamento que se tentaria reagendar
 * @param payload - Corpo que a especificação descreve para o reagendamento
 * @param paramsDefault - Parâmetros padrão da requisição
 * @rotaAusente POST /public/me/appointments/{id}/reschedule
 * @returns Resposta da rota inexistente, esperada como 404
 */
export default async function postPublicRescheduleAppointment(
	appointmentId: string,
	payload: { startsAt: string; reason: string },
	paramsDefault: IParamsDefault,
) {
	return await specPactumJs()
		.post(
			`${process.env.BASE_URL}${apiName.publicMe}/appointments/${appointmentId}/reschedule`,
		)
		.withBearerToken(`${paramsDefault.token}`)
		.withJson(payload)
		.expectStatus(
			paramsDefault.statusCode,
			`O status code da requisição POST ${apiName.publicMe}/appointments/{id}/reschedule não é o esperado.`,
		)
		.retry({
			count: paramsDefault.retry.count,
			delay: paramsDefault.retry.delay,
			strategy: ({ res }) => res.statusCode === paramsDefault.statusCode,
		})
}
