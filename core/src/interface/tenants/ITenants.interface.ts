/**
 * Contratos do domínio `tenants` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface ICreateTenantAdmin {
	name: string
	email: string
	phone?: string | null
	jobTitle?: string | null
	password: string
}

export interface ICreateTenant {
	status?: "active" | "inactive"
	/** Módulos liberados para esta organização, além dos incluídos no plano. */
	enabledModules?: Array<string>
	/** Recebe as notificações de reserva. Normalizado para minúsculas; vazio vira `null`. */
	contactEmail?: string | null
	contactPhone?: string | null
	name: string
	slug: string
	planId: string
}

export interface IResetTenantAdminPassword {
	password: string
}

export interface ISetTenantAdminStatus {
	isActive: boolean
}

export interface ITenantAdmin {
	id: string
	name: string | null
	email: string
	phone: string | null
	jobTitle: string | null
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface ITenantAdminPasswordReset {
	id: string
	email: string
}

export interface ITenantListItem {
	id: string
	name: string
	contactEmail: string | null
	contactPhone: string | null
	slug: string
	status: "active" | "inactive"
	planId: string
	enabledModules: Array<string>
	createdAt: string
	updatedAt: string
	/** Placeholder `Sem plano` quando a organização está sem plano. */
	plan: ITenantPlan
}

export interface ITenantPlan {
	/** Vazio quando a organização está sem plano. */
	id: string
	/** `Sem plano` quando não há plano vinculado. */
	name: string
	priceCents: number | null
	currency: string
	billingCycle: "monthly" | "yearly" | "custom"
	includedModules: Array<string>
}

export interface IUpdateTenantAdmin {
	name?: string
	email?: string
	phone?: string | null
	jobTitle?: string | null
}

export interface IUpdateTenant {
	status?: "active" | "inactive"
	/** Módulos liberados para esta organização, além dos incluídos no plano. */
	enabledModules?: Array<string>
	/** Recebe as notificações de reserva. Normalizado para minúsculas; vazio vira `null`. */
	contactEmail?: string | null
	contactPhone?: string | null
	name?: string
	/** Identificador na URL pública do app do usuário final. */
	slug?: string
	planId?: string
}
