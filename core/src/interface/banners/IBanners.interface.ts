/**
 * Contratos do domínio `banners` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IBanner {
	id: string
	tenantId: string
	title: string
	description: string
	actionLink: string | null
	actionLabel: string | null
	imageKey: string
	/** URL pública derivada de `imageKey`, pronta para uso no `src` da imagem. */
	imageUrl: string
	isActive: boolean
	position: number
	createdAt: string
	updatedAt: string
}

export interface IBannerList {
	items: Array<IBanner>
	/** Padrões de fábrica quando a organização ainda não salvou o carrossel. */
	settings: ICarouselSettings
}

export interface ICarouselSettings {
	/** Tempo de exibição de cada banner, em segundos. */
	interval: 3 | 5 | 7 | 10
	height: "small" | "medium" | "large"
	/** Exibe os pontos indicadores sob o carrossel. */
	showIndicators: boolean
}

export interface ICreateBanner {
	title: string
	description?: string
	/** Chave devolvida por `POST /dashboard/banners/uploads`. */
	imageKey: string
	/** Precisa começar com http:// ou https://. */
	actionLink?: string
	/** Texto do botão de ação. */
	actionLabel?: string
	/** No máximo 3 banners podem estar ativos ao mesmo tempo. */
	isActive?: boolean
}

export interface IReorderBanners {
	/** Precisa conter exatamente os IDs existentes, sem repetição, na ordem desejada. */
	ids: Array<string>
}

export interface IReorderedBanners {
	ids: Array<string>
}

export interface IUpdateBanner {
	title?: string
	description?: string
	imageKey?: string
	actionLink?: string
	actionLabel?: string
	isActive?: boolean
}
