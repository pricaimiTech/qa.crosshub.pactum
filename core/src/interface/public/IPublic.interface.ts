/**
 * Contratos do domínio `public` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
import type { IAppointment, IAvailabilitySlot, IFormQuestion, IQuestionOption } from "../shared/IShared.interface"

export interface ICancelClientAppointment {
	/** Motivo informado pelo cliente. */
	reason?: string
}

export interface ICancelReservation {
	reason?: string
}

export interface ICompletedFormCard {
	id: string
	title: string
	description: string
	type: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	questionCount: number
	containsSensitiveData: boolean
	/** Tempo estimado de preenchimento, em minutos. */
	estimatedMinutes: number
	submittedAt: string
}

export interface ICreateClientAppointment {
	serviceId: string
	startsAt: string
	notes?: string
	professionalId?: string
	packageContractId?: string
	idempotencyKey?: string
}

export interface ICreateReservation {
	/** Observação enviada à organização junto com a reserva. */
	note?: string
}

export interface IMyForms {
	/** Formulários que a pessoa ainda pode responder. */
	available: Array<IPublicFormCard>
	/** Formulários de resposta única já enviados. */
	completed: Array<ICompletedFormCard>
}

export interface IPersonAvailability {
	date: string
	/** `true` quando a pessoa já tem atendimento no dia. Nesse caso `slots` volta
vazio e `message` explica o bloqueio. */
	blockedByExistingAppointment: boolean
	/** Presente apenas quando o dia está bloqueado. */
	message?: string
	/** Presente apenas quando o dia está bloqueado. */
	existingAppointments?: Array<IAppointment>
	slots: Array<IAvailabilitySlot>
}

export interface IPersonReservation {
	id: string
	status: "pending" | "in_progress" | "confirmed" | "completed" | "cancelled"
	note: string
	cancellationReason: string | null
	cancelledBy: "admin" | "client" | null
	cancelledAt: string | null
	createdAt: string
	updatedAt: string
	productName: string
	productPriceCents: number | null
	productImageKey: string | null
	productImageUrl: string | null
}

export interface IPublicBanner {
	id: string
	title: string
	description: string
	actionLink: string | null
	actionLabel: string | null
	imageUrl: string | null
}

export interface IPublicCarousel {
	interval: 3 | 5 | 7 | 10
	height: "small" | "medium" | "large"
	showIndicators: boolean
}

export interface IPublicCategory {
	id: string
	name: string
}

export interface IPublicCategoryList {
	tenant: string
	/** Somente categorias ativas. */
	items: Array<IPublicCategory>
}

export interface IPublicFormCard {
	id: string
	title: string
	description: string
	type: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	questionCount: number
	containsSensitiveData: boolean
	/** Tempo estimado de preenchimento, em minutos. */
	estimatedMinutes: number
}

export interface IPublicFormDetail {
	id: string
	title: string
	description: string
	type: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	submissionMode: "ONCE_PER_PERSON" | "MULTIPLE"
	containsSensitiveData: boolean
	publishedAt: string | null
	questionCount: number
	estimatedMinutes: number
	questions: Array<IFormQuestion>
}

export interface IPublicProduct {
	id: string
	name: string
	description: string
	priceCents: number | null
	imageKey: string | null
	imageUrl: string | null
	categoryName: string | null
}

export interface IPublicProductList {
	/** Slug da organização consultada. */
	tenant: string
	/** Somente produtos ativos. */
	items: Array<IPublicProduct>
}

export interface IPublicTenant {
	/** Nome de exibição do branding, com o nome da organização como reserva. */
	name: string
	slogan: string
	description: string
	slug: string
	accentColor: string
	themeMode: "dark" | "light"
	/** Rampa já resolvida; o cliente não recalcula. */
	theme: IPublicTenantTheme
	logoUrl: string | null
	coverUrl: string | null
	carousel: IPublicCarousel
	/** Somente banners ativos. */
	banners: Array<IPublicBanner>
}

export interface IPublicTenantTheme {
	seed: string
	mode: "dark" | "light"
	neutral: Array<string>
	accent: Array<string>
	tokens: Record<string, string>
}

export interface ISubmitAnswer {
	questionId: string
	/** Resposta de `SINGLE_CHOICE`. */
	optionId?: string
	/** Respostas de `MULTIPLE_CHOICE`. */
	optionIds?: Array<string>
	/** Resposta de `SHORT_TEXT` e `LONG_TEXT`. */
	textValue?: string
	/** Resposta de `SCALE`. */
	numberValue?: number
	/** Resposta de `CONSENT`. */
	booleanValue?: boolean
}

export interface ISubmitForm {
	/** Uma entrada por pergunta respondida. */
	answers: Array<ISubmitAnswer>
}

export interface ISubmitFormResult {
	submissionId: string
	submittedAt: string
	/** Mensagem configurada no formulário, ou o texto padrão de sucesso. */
	completionMessage: string
}

/** Query string de `GET /public/appointments/availability`. */
export interface IGetPublicAvailabilityQuery {
	serviceId: string
	date: string
	/** Restringe a busca a um profissional específico. */
	professionalId?: string
}
