/**
 * Contratos do domínio `shared` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IAvailabilitySlot {
	professionalId: string
	startsAt: string
	endsAt: string
	/** Quantas vagas do slot já estão ocupadas. */
	occupied: number
	capacity: number
	sortOrder: number
}

export interface IFormQuestion {
	id: string
	type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "SCALE" | "CONSENT"
	title: string
	isRequired: boolean
	position: number
	/** Configurações específicas do tipo (ex.: `min` e `max` em perguntas de escala). */
	settingsJson: Record<string, Record<string, unknown>>
	/** Vazio nos tipos que não têm opções. */
	options: Array<IQuestionOption>
}

export interface IPackageContract {
	id: string
	tenantId: string
	personId: string
	packageId: string
	totalCredits: number
	totalCents: number
	purchasedAt: string
	expiresAt: string | null
	status: "active" | "exhausted" | "expired" | "cancelled"
	createdAt: string
	updatedAt: string
	/** Pagamentos menos estornos do contrato (listagem por pessoa). */
	paidCents?: number
	/** Valor do contrato menos o pago; zero se cancelado (listagem por pessoa). */
	outstandingCents?: number
}

export interface IProfessional {
	id: string
	tenantId: string
	name: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface IQuestionOption {
	id: string
	label: string
	value: string
	position: number
}

export interface IReservation {
	id: string
	tenantId: string
	personId: string
	productId: string
	/** Observação enviada pelo cliente ao reservar. */
	note: string
	status: "pending" | "in_progress" | "confirmed" | "completed" | "cancelled"
	cancellationReason: string | null
	cancelledBy: "admin" | "client" | null
	cancelledAt: string | null
	createdAt: string
	updatedAt: string
}

export interface IService {
	id: string
	tenantId: string
	name: string
	description: string
	approvalMode: "manual" | "automatic"
	professionalSelectionMode: "automatic" | "optional" | "required"
	unitPriceCents: number
	isActive: boolean
	createdAt: string
	updatedAt: string
	/** Presente apenas na listagem. */
	professionals?: Array<IServiceProfessional>
}

export interface IServiceProfessional {
	professionalId: string
	/** Duração do atendimento, em minutos. */
	durationMinutes: number
	/** Intervalo reservado após o atendimento, em minutos. */
	intervalMinutes: number
	/** Quantos clientes cabem no mesmo horário. */
	capacity: number
	sortOrder?: number
	/** String vazia é aceita e tratada como null. */
	unitPriceCents?: number | null
	id: string
	tenantId: string
	serviceId: string
	isActive: boolean
	professional: IProfessional
}

export interface ITenant {
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
}

export interface IUploadedAsset {
	/** Chave a persistir no recurso (ex.: `imageKey`, `photoKey`). */
	key: string
	/** URL pública servida por `/assets/**`. */
	publicUrl: string | null
}
