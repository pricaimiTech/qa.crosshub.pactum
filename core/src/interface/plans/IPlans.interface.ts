/**
 * Contratos do domínio `plans` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface ICreatePlan {
	description?: string
	/** `null` indica plano sob consulta, sem preço de tabela. */
	priceCents?: number | null
	/** Código ISO 4217; gravado em maiúsculas. */
	currency?: string
	billingCycle?: "monthly" | "yearly" | "custom"
	isActive?: boolean
	/** Posição na listagem de planos. */
	sortOrder?: number
	name: string
	slug: string
	/** Pode vir vazio: é assim que se cria um plano personalizado. */
	includedModules: Array<"branding" | "banners" | "shop" | "people" | "access_codes" | "quiz">
}

export interface IPlan {
	id: string
	name: string
	slug: string
	description: string
	priceCents: number | null
	currency: string
	billingCycle: "monthly" | "yearly" | "custom"
	includedModules: Array<"branding" | "banners" | "shop" | "people" | "access_codes" | "quiz">
	isActive: boolean
	sortOrder: number
	createdAt: string
	updatedAt: string
}

export interface IPlanListItem {
	id: string
	name: string
	slug: string
	description: string
	priceCents: number | null
	currency: string
	billingCycle: "monthly" | "yearly" | "custom"
	includedModules: Array<"branding" | "banners" | "shop" | "people" | "access_codes" | "quiz">
	isActive: boolean
	sortOrder: number
	createdAt: string
	updatedAt: string
	/** Quantas organizações usam este plano. */
	tenantCount: number
}

export interface ISetPlanStatus {
	isActive: boolean
}

export interface IUpdatePlan {
	description?: string
	/** `null` indica plano sob consulta, sem preço de tabela. */
	priceCents?: number | null
	/** Código ISO 4217; gravado em maiúsculas. */
	currency?: string
	billingCycle?: "monthly" | "yearly" | "custom"
	isActive?: boolean
	/** Posição na listagem de planos. */
	sortOrder?: number
	name?: string
	slug?: string
	/** Duplicatas são removidas antes de gravar, em vez de rejeitadas. */
	includedModules?: Array<"branding" | "banners" | "shop" | "people" | "access_codes" | "quiz">
}

/** Query string de `GET /admin/plans`. */
export interface IGetListPlansQuery {
	/** Aceita apenas a string `"false"` para ocultar planos inativos; qualquer
outro valor (inclusive a ausência do parâmetro) inclui todos. */
	includeInactive?: "true" | "false"
}
