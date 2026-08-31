import { preSetup } from "../../constants"
import type { ICreateGroups } from "../../interface/groups/IGroups.interface"
import type { IParamsDefault } from "../../interface/global.interface"
import getListGroups from "../../services/groups/getListGroups.service"
import patchUpdateGroup from "../../services/groups/patchUpdateGroup.service"
import postCreateGroup from "../../services/groups/postCreateGroup.service"

/** Grupo como devolvido pela API. */
export interface IGroupSummary {
	id: string
	name: string
	status: string
	participantCount: number
	participantIds: Array<string>
	strategyLabel: string
}

export default class GroupsBusiness {
	/**
	 * Cria grupos e devolve o que a API montou.
	 *
	 * A rota devolve **uma lista**: no modo `split` ela cria vários grupos de uma
	 * vez, e no modo manual devolve um único item dentro do array.
	 * @param group - Payload, vindo do `GroupDataBuilder`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Grupos criados
	 */
	public async createGroups(
		group: ICreateGroups,
		paramsDefault: IParamsDefault,
	): Promise<Array<IGroupSummary>> {
		const response = await postCreateGroup(group, paramsDefault)

		return response.json
	}

	/**
	 * Tenta criar grupos com payloads inválidos e devolve a mensagem de cada um.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for` — e vários
	 * casos deste módulo percorrem uma variação por parâmetro.
	 * @param groups - Payloads inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, já serializada
	 */
	public async rejectedGroups(
		groups: Array<ICreateGroups>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const group of groups) {
			const response = await postCreateGroup(group, paramsDefault)
			messages.push(JSON.stringify(response.json.message))
		}

		return messages
	}

	/**
	 * Grupos do tenant cujo nome começa com o prefixo do caso.
	 * @param prefix - Prefixo do nome
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Grupos encontrados
	 */
	public async groupsByPrefix(
		prefix: string,
		paramsDefault: IParamsDefault,
	): Promise<Array<IGroupSummary>> {
		const response = await getListGroups(
			preSetup.preSetupParamsDefault200(
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)
		const groups: Array<IGroupSummary> = response.json

		return groups.filter((group) => group.name.startsWith(prefix))
	}

	/**
	 * Cria cada grupo enviado e devolve a composição resultante.
	 *
	 * O caso `G-08` compara as três estratégias: se o rótulo fosse algoritmo, a
	 * ordem dos participantes mudaria entre elas.
	 * @param groups - Payloads já montados, um por variação
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Uma string por payload, com os ids na ordem devolvida
	 */
	public async compositionsOf(
		groups: Array<ICreateGroups>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const compositions: Array<string> = []

		for (const group of groups) {
			const created = await this.createGroups(group, paramsDefault)
			compositions.push(created[0].participantIds.join(","))
		}

		return compositions
	}

}
