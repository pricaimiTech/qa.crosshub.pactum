/**
 * Contratos do domínio `catalog` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IAdminReservation {
	id: string
	status: "pending" | "in_progress" | "confirmed" | "completed" | "cancelled"
	note: string
	cancellationReason: string | null
	cancelledBy: "admin" | "client" | null
	cancelledAt: string | null
	createdAt: string
	updatedAt: string
	productId: string
	productName: string
	productDescription: string
	productPriceCents: number | null
	productImageKey: string | null
	productImageUrl: string | null
	categoryName: string | null
	personId: string
	personName: string
	personEmail: string | null
	personPhone: string | null
}

export interface ICategory {
	id: string
	tenantId: string
	name: string
	description: string
	icon: string
	position: number
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface ICategoryInput {
	name: string
	description?: string
	/** Nome do ícone em minúsculas, dígitos e hífens. */
	icon?: string
	isActive?: boolean
}

export interface ICreateProduct {
	description?: string
	/** `null` desvincula o produto de qualquer categoria. A categoria precisa estar ativa. */
	categoryId?: string | null
	/** `null` esconde o preço na vitrine. */
	priceCents?: number | null
	/** Chave devolvida pelo upload de imagem. */
	imageKey?: string | null
	isActive?: boolean
	name: string
}

export interface IProduct {
	id: string
	name: string
	description: string
	categoryId: string | null
	/** Nulo quando o produto não tem categoria. */
	categoryName: string | null
	priceCents: number | null
	imageKey: string | null
	imageUrl: string | null
	isActive: boolean
	createdAt: string
}

export interface IUpdateProduct {
	description?: string
	/** `null` desvincula o produto de qualquer categoria. A categoria precisa estar ativa. */
	categoryId?: string | null
	/** `null` esconde o preço na vitrine. */
	priceCents?: number | null
	/** Chave devolvida pelo upload de imagem. */
	imageKey?: string | null
	isActive?: boolean
	name?: string
}

export interface IUpdateReservation {
	/** Transições permitidas: `pending → in_progress|cancelled`,
`in_progress → confirmed|cancelled`, `confirmed → completed|cancelled`. */
	status: "in_progress" | "confirmed" | "completed" | "cancelled"
	/** Obrigatório quando `status` é `cancelled`. */
	cancellationReason?: string
}
