import { preSetup } from "../../constants"
import type { IParamsDefault } from "../../interface/global.interface"
import getProfessionals from "../../services/privacy/getProfessionals.service"
import patchUpdateSettings from "../../services/privacy/patchUpdateSettings.service"
import patchSensitiveDataAccess from "../../services/privacy/patchSensitiveDataAccess.service"

/** Admin do tenant, como aparece na lista de privacidade. */
export interface IPrivacyProfessional {
	id: string
	email: string
	isActive: boolean
	isPrimaryAdmin: boolean
	canViewSensitiveData: boolean
}

export default class PrivacyBusiness {
	/**
	 * Lista os admins do tenant com o estado de acesso a dados sensíveis.
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Admins do tenant
	 */
	public async professionals(
		paramsDefault: IParamsDefault,
	): Promise<Array<IPrivacyProfessional>> {
		const response = await getProfessionals(paramsDefault)

		return response.json
	}

	/**
	 * Estado de acesso de um admin específico.
	 * @param adminId - Id do admin consultado
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns O admin encontrado na lista de privacidade
	 */
	public async professionalById(
		adminId: string,
		paramsDefault: IParamsDefault,
	): Promise<IPrivacyProfessional> {
		const professionals = await this.professionals(paramsDefault)

		return professionals.filter(
			(professional) => professional.id === adminId,
		)[0]
	}

	/**
	 * Define o acesso a dados sensíveis de um admin.
	 *
	 * Deixa o estado explícito no `before` dos casos de permissão: sem isso, a
	 * execução anterior decide se o teste começa autorizado ou não.
	 * @param adminId - Admin alvo
	 * @param allowed - Se ele pode ver respostas sensíveis
	 * @param paramsDefault - Parâmetros padrão autenticados como Administrador Principal
	 */
	public async setSensitiveAccess(
		adminId: string,
		allowed: boolean,
		paramsDefault: IParamsDefault,
	): Promise<void> {
		await patchSensitiveDataAccess(
			adminId,
			{ allowed },
			preSetup.preSetupParamsDefault200(
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)
	}

	/**
	 * Tenta gravar cada valor inválido de retenção e devolve a mensagem de erro.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for` — e o caso
	 * `LGPD-10` percorre quatro variações do mesmo campo.
	 * @param values - Valores inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, já serializada
	 */
	public async rejectedRetentionDays(
		values: Array<number>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const value of values) {
			const response = await patchUpdateSettings(
				{ sensitiveDataRetentionDays: value },
				paramsDefault,
			)

			messages.push(JSON.stringify(response.json.message))
		}

		return messages
	}
}
