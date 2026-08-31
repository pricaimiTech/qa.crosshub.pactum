import { preSetup } from "../../constants"
import type {
	ICarouselSettings,
	ICreateBanner,
} from "../../interface/banners/IBanners.interface"
import type { IParamsDefault } from "../../interface/global.interface"
import deleteBanner from "../../services/banners/deleteBanner.service"
import getListBanners from "../../services/banners/getListBanners.service"
import postCreateBanner from "../../services/banners/postCreateBanner.service"
import patchBannerSettings from "../../services/banners/patchBannerSettings.service"
import patchReorderBanners from "../../services/banners/patchReorderBanners.service"
import postUploadBanner from "../../services/banners/postUploadBanner.service"

/** Banner como devolvido pela API. */
export interface IBannerSummary {
	id: string
	title: string
	position: number
	isActive: boolean
	imageUrl: string
}

export default class BannersBusiness {
	/**
	 * Envia uma imagem e devolve a chave, para vincular ao banner.
	 * @param filePath - Caminho do arquivo gerado pela suíte
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Chave da imagem no armazenamento
	 */
	public async uploadImage(
		filePath: string,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const response = await postUploadBanner(
			filePath,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)

		return response.json.key
	}

	/**
	 * Apaga todos os banners do tenant.
	 *
	 * O limite de três ativos é estado do tenant inteiro: sem zerar antes, o caso
	 * herda os banners da execução anterior e falha por um motivo que não é o seu.
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 */
	public async cleanupBanners(paramsDefault: IParamsDefault): Promise<void> {
		const read200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		// A listagem vem como `{ items, settings }`, não como array puro.
		const response = await getListBanners(read200)
		const banners: Array<IBannerSummary> = response.json.items

		for (const banner of banners) {
			await deleteBanner(banner.id, read200)
		}
	}

	/**
	 * Cria vários banners em sequência e devolve os ids.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for`.
	 * @param banners - Payloads, um por banner
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Ids dos banners criados, na ordem enviada
	 */
	public async createBanners(
		banners: Array<ICreateBanner>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const ids: Array<string> = []

		for (const banner of banners) {
			const response = await postCreateBanner(banner, created201)
			ids.push(response.json.id)
		}

		return ids
	}

	/**
	 * Tenta criar banners inválidos e devolve a mensagem de cada tentativa.
	 * @param banners - Payloads inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, em texto plano
	 */
	public async rejectedBanners(
		banners: Array<ICreateBanner>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const banner of banners) {
			const response = await postCreateBanner(banner, paramsDefault)

			messages.push(
				Array.isArray(response.json.message)
					? response.json.message.join(" | ")
					: `${response.json.message}`,
			)
		}

		return messages
	}

	/** Banners do tenant, na ordem devolvida pela API. */
	public async banners(
		paramsDefault: IParamsDefault,
	): Promise<Array<IBannerSummary>> {
		const response = await getListBanners(paramsDefault)

		return response.json.items
	}

	/** Configurações do carrossel do tenant. */
	public async carouselSettings(paramsDefault: IParamsDefault): Promise<{
		interval: number
		height: string
		showIndicators: boolean
	}> {
		const response = await getListBanners(paramsDefault)

		return response.json.settings
	}

	/**
	 * Tenta reordenar com listas inválidas e devolve a mensagem de cada tentativa.
	 * @param orders - Listas de ids inválidas, uma por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, em texto plano
	 */
	public async rejectedReorders(
		orders: Array<Array<string>>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const ids of orders) {
			const response = await patchReorderBanners({ ids }, paramsDefault)

			messages.push(
				Array.isArray(response.json.message)
					? response.json.message.join(" | ")
					: `${response.json.message}`,
			)
		}

		return messages
	}

	/**
	 * Tenta gravar configurações inválidas do carrossel e devolve as mensagens.
	 *
	 * Os payloads são parcialmente tipados porque o objetivo é violar o contrato —
	 * intervalo fora do enum e altura desconhecida.
	 * @param settings - Configurações inválidas, uma por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, em texto plano
	 */
	public async rejectedCarouselSettings(
		settings: Array<Record<string, unknown>>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const setting of settings) {
			const response = await patchBannerSettings(
				setting as unknown as ICarouselSettings,
				paramsDefault,
			)

			messages.push(
				Array.isArray(response.json.message)
					? response.json.message.join(" | ")
					: `${response.json.message}`,
			)
		}

		return messages
	}
}
