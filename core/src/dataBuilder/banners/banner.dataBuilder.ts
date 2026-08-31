import { faker } from "@faker-js/faker"
import type { ICreateBanner } from "../../interface/banners/IBanners.interface"

/** Payload de `POST /dashboard/banners`. */
export default class BannerDataBuilder {
	private bannerData: ICreateBanner

	constructor() {
		this.bannerData = BannerDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICreateBanner {
		return {
			title: `[QA] Banner ${faker.string.alphanumeric(8)}`,
			description: "",
			imageKey: "",
			isActive: true,
		}
	}

	/**
	 * Define o título do banner, sufixado para não colidir entre execuções
	 * @param title - Prefixo do título, normalmente o ID do caso de teste
	 */
	withTitle(title: string): BannerDataBuilder {
		this.bannerData.title = `${title} ${faker.string.alphanumeric(8)}`
		return this
	}

	/**
	 * Vincula a imagem enviada pelo upload
	 * @param imageKey - Chave devolvida por `POST /dashboard/banners/uploads`
	 */
	withImageKey(imageKey: string): BannerDataBuilder {
		this.bannerData.imageKey = imageKey
		return this
	}

	/**
	 * Define se o banner entra na contagem dos três ativos
	 * @param isActive - `false` cria sem ocupar vaga no carrossel
	 */
	withIsActive(isActive: boolean): BannerDataBuilder {
		this.bannerData.isActive = isActive
		return this
	}

	/**
	 * Define o link e o texto do botão de ação
	 * @param actionLink - URL de destino
	 * @param actionLabel - Texto do botão
	 */
	withAction(actionLink: string, actionLabel?: string): BannerDataBuilder {
		this.bannerData.actionLink = actionLink
		this.bannerData.actionLabel = actionLabel
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**, porque o Mocha em
	 * paralelo roda vários arquivos de teste no mesmo processo.
	 */
	build(): ICreateBanner {
		const payload = structuredClone(this.bannerData)
		this.bannerData = BannerDataBuilder.defaults()

		return payload
	}
}
