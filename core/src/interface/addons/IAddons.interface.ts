/**
 * Contratos do domínio `addons` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IAddOn {
	id: string
	/** Código estável usado nas checagens de entitlement. */
	code: string
	name: string
	description: string
	priceCents: number
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface IAdminAddOnInterest {
	id: string
	kind: "contract" | "trial"
	status: "pending" | "handled"
	createdAt: string
	requestedByEmail: string | null
	tenantId: string
	addOnCode: string
	requestedByUserId: string | null
	handledAt: string | null
}

export interface ISaveTenantAddOn {
	addOnId: string
	/** `trial` só vale enquanto `trialEndsAt` estiver no futuro. */
	status: "active" | "trial" | "inactive"
	/** Preço acordado com a organização, em centavos. */
	referencePriceCents: number
	/** Fim da vigência. Sem valor, o add-on ativo não expira. */
	endsAt?: string
	/** Fim do período de teste; obrigatório na prática para o status `trial`. */
	trialEndsAt?: string
}

export interface ITenantAddOn {
	id: string
	tenantId: string
	addOnId: string
	status: "active" | "trial" | "inactive"
	startsAt: string
	endsAt: string | null
	trialEndsAt: string | null
	referencePriceCents: number
	createdAt: string
	updatedAt: string
}
