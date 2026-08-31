import type { ISaveBranding } from "../../interface/branding/IBranding.interface"
import type { IParamsDefault } from "../../interface/global.interface"
import putSaveBranding from "../../services/branding/putSaveBranding.service"

export default class BrandingBusiness {
	/**
	 * Tenta salvar marcas inválidas e devolve a mensagem de cada tentativa.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for`. Os
	 * payloads são parcialmente tipados porque o objetivo é justamente violar o
	 * contrato — faltando campo obrigatório ou com cor fora do formato.
	 * @param brandings - Payloads inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, em texto plano
	 */
	public async rejectedBrandings(
		brandings: Array<Record<string, unknown>>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const branding of brandings) {
			const response = await putSaveBranding(
				branding as unknown as ISaveBranding,
				paramsDefault,
			)

			// Juntar em vez de `JSON.stringify`: a mensagem do tema contém aspas
			// (`O tema deve ser "dark" ou "light".`) e a serialização as escaparia,
			// fazendo a comparação nunca casar.
			messages.push(
				Array.isArray(response.json.message)
					? response.json.message.join(" | ")
					: `${response.json.message}`,
			)
		}

		return messages
	}
}
