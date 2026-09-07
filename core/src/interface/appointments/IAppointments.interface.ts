/**
 * Contratos do domínio `appointments` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
import type { IAvailabilitySlot } from "../shared/IShared.interface"

export interface IAdjustFinancial {
	/** Desconto em centavos. */
	discountCents?: number
	/** Acréscimo em centavos. */
	surchargeCents?: number
	/** Marca o atendimento como isento. */
	waive: boolean
	reason?: string
}

export interface IAdminAvailability {
	slots: Array<IAvailabilitySlot>
}

export interface IAnalyticsHole {
	professionalName: string
	date: string
	/** Somente janelas de 30 minutos ou mais são reportadas. */
	minutes: number
}

export interface IAnalyticsQuery {
	from?: string
	to?: string
	serviceId?: string
	professionalId?: string
}

export interface IAnalyticsRow {
	id: string
	date: string
	serviceName: string
	professionalName: string
	status: "pending" | "approved" | "rejected" | "cancelled_by_client" | "cancelled_by_admin" | "completed" | "no_show"
	totalCents: number
	receivedCents: number
}

export interface IAppointmentAnalytics {
	/** Filtros ecoados da consulta. */
	filters: IAnalyticsQuery
	appointmentCount: number
	completedCount: number
	noShowCount: number
	/** Soma de cancelamentos por admin, por cliente e rejeições. */
	cancellationCount: number
	/** Receita prevista do período. */
	projectedCents: number
	receivedCents: number
	outstandingCents: number
	occupancyPercent: number
	/** Janelas ociosas, da maior para a menor. */
	holes: Array<IAnalyticsHole>
	rows: Array<IAnalyticsRow>
}

export interface IAppointment {
	id: string
	tenantId: string
	personId: string
	serviceId: string
	professionalId: string
	startsAt: string
	endsAt: string
	status: "pending" | "approved" | "rejected" | "cancelled_by_client" | "cancelled_by_admin" | "completed" | "no_show"
	createdBy: "client" | "admin"
	approvedByUserId: string | null
	approvedAt: string | null
	cancelledAt: string | null
	cancellationReason: string | null
	notes: string
	unitPriceCents: number
	discountCents: number
	surchargeCents: number
	totalCents: number
	priceSource: "service" | "professional" | "manual"
	financialStatus: "pending" | "partial" | "paid" | "covered_by_package" | "waived" | "refunded" | "void"
	packageContractId: string | null
	/** Agendamento que este substituiu, quando nasceu de uma remarcação. */
	rescheduledFromId: string | null
	/** Agendamento que substituiu este, quando foi remarcado. */
	rescheduledToId: string | null
	createdAt: string
	updatedAt: string
}

export interface IAppointmentFinancial {
	appointmentId: string
	unitPriceCents: number
	discountCents: number
	surchargeCents: number
	totalCents: number
	financialStatus: "pending" | "partial" | "paid" | "covered_by_package" | "waived" | "refunded" | "void"
	/** Soma dos pagamentos menos os estornos. */
	receivedCents: number
	/** Nunca negativo: excedentes não viram saldo credor. */
	outstandingCents: number
	payments: Array<IPayment>
}

export interface IAppointmentSettings {
	/** Identificador IANA usado para calcular as bordas de cada dia da agenda. */
	timezone: string
	/** Antecedência mínima, em horas, para o cliente cancelar sem penalidade. */
	cancellationNoticeHours: number
	/** Devolve o crédito do pacote quando o cliente cancela fora do prazo. */
	restoreCreditOnLateCancellation: boolean
	/** Devolve o crédito quando o cliente não comparece. */
	restoreCreditOnNoShow: boolean
	/** Devolve o crédito quando o cancelamento parte do admin. */
	restoreCreditOnAdminCancellation: boolean
	tenantId: string
	createdAt: string
	updatedAt: string
}

export interface IAvailabilityRule {
	/** Dia da semana, de 0 (domingo) a 6 (sábado). */
	weekday: number
	shift: "morning" | "afternoon" | "night"
	startTime: string
	/** Deve ser maior que startTime. */
	endTime: string
	/** Ordem de exibição; quando omitido, assume a posição no array. */
	sortOrder?: number
}

export interface IBlock {
	id: string
	tenantId: string
	professionalId: string | null
	serviceId: string | null
	startsAt: string
	endsAt: string
	reason: string
	createdAt: string
	updatedAt: string
}

export interface ICalendar {
	appointments: Array<IAppointment>
	/** Feriados nacionais dentro do período consultado. */
	holidays: Array<IHoliday>
}

export interface ICreateAppointment {
	personId: string
	serviceId: string
	startsAt: string
	notes?: string
	/** Quando omitido, o profissional é escolhido conforme o modo do serviço. */
	professionalId?: string
	/** Contrato de pacote a debitar em vez de cobrar avulso. */
	packageContractId?: string
	/** Chave de idempotência da criação. */
	idempotencyKey?: string
}

export interface ICreateBlock {
	startsAt: string
	endsAt: string
	/** Bloqueia a agenda de um profissional. Exigido quando `serviceId` é omitido —
ao menos um dos dois precisa estar presente. */
	professionalId?: string | null
	/** Bloqueia um serviço inteiro. Exigido quando `professionalId` é omitido. */
	serviceId?: string | null
	reason?: string
}

export interface ICreatePackage {
	name: string
	priceCents: number
	totalCredits: number
	/** String vazia é aceita e tratada como null. */
	validityDays?: number | null
	isActive?: boolean
	services: Array<IPackageService>
}

export interface ICreateProfessional {
	/** Nome exibido na agenda. */
	name: string
	/** Profissionais inativos não aparecem para agendamento, mas preservam o histórico. */
	isActive?: boolean
}

export interface ICreateService {
	name: string
	description?: string
	/** `manual` exige aprovação do admin; `automatic` confirma na hora. */
	approvalMode?: "manual" | "automatic"
	/** Como o cliente escolhe o profissional ao agendar. */
	professionalSelectionMode?: "automatic" | "optional" | "required"
	/** Preço base, em centavos. Pode ser sobrescrito por profissional. */
	unitPriceCents?: number
	isActive?: boolean
}

export interface IEditAppointment {
	personId: string
	serviceId: string
	startsAt: string
	notes?: string
	professionalId?: string
}

export interface IExceptionalCreditRestore {
	/** Justificativa da devolução excepcional do crédito. */
	reason: string
}

export interface IHoliday {
	date: string
	name: string
}

export interface ILedgerAppointment {
	id: string
	startsAt: string
	/** Vazio quando o serviço foi removido. */
	serviceName: string
}

export interface IPackage {
	id: string
	tenantId: string
	name: string
	priceCents: number
	totalCredits: number
	validityDays: number | null
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface IPackageLedgerEntry {
	id: string
	tenantId: string
	contractId: string
	appointmentId: string | null
	type: "grant" | "consume" | "restore" | "expire" | "adjustment"
	/** Positivo credita, negativo consome. */
	deltaCredits: number
	reason: string
	createdByUserId: string | null
	createdAt: string
	/** Saldo acumulado até este lançamento, calculado na consulta. */
	balance: number
	appointment: ILedgerAppointment
}

export interface IPackageService {
	serviceId: string
	/** Quantos créditos cada sessão deste serviço consome. */
	creditsPerSession?: number
}

export interface IPayment {
	id: string
	tenantId: string
	appointmentId: string | null
	packageContractId: string | null
	type: "payment" | "refund"
	amountCents: number
	method: "cash" | "pix" | "credit_card" | "debit_card" | "bank_transfer" | "other" | null
	notes: string
	registeredByUserId: string | null
	createdAt: string
}

export interface IPersonFinancialSummary {
	receivedCents: number
	outstandingCents: number
	/** Média por atendimento concluído; 0 quando não há nenhum. */
	ticketAverageCents: number
	completedAppointments: number
	/** Os cinco lançamentos mais recentes. */
	recentPayments: Array<IPayment>
}

export interface IProfessionalAvailability {
	id: string
	tenantId: string
	professionalId: string
	weekday: number
	shift: "morning" | "afternoon" | "night"
	startTime: string
	endTime: string
	sortOrder: number
}

export interface IRefundPayment {
	/** Valor a estornar, em centavos. Não pode exceder o total já pago. */
	amountCents: number
	notes?: string
	idempotencyKey?: string
}

export interface IRegisterPayment {
	/** Valor recebido, em centavos. */
	amountCents: number
	method: "cash" | "pix" | "credit_card" | "debit_card" | "bank_transfer" | "other"
	notes?: string
	/** Chave de idempotência do lançamento. */
	idempotencyKey?: string
}

export interface IRescheduleAppointment {
	startsAt: string
	professionalId?: string
	/** Motivo da remarcação, registrado na auditoria. */
	reason: string
}

export interface IRescheduleResult {
	/** O original, cancelado pelo admin com `rescheduledToId` preenchido. */
	previous: IAppointment
	/** O substituto, com `rescheduledFromId` apontando para o original. */
	replacement: IAppointment
}

export interface ISaveAppointmentSettings {
	/** Identificador IANA usado para calcular as bordas de cada dia da agenda. */
	timezone: string
	/** Antecedência mínima, em horas, para o cliente cancelar sem penalidade. */
	cancellationNoticeHours: number
	/** Devolve o crédito do pacote quando o cliente cancela fora do prazo. */
	restoreCreditOnLateCancellation: boolean
	/** Devolve o crédito quando o cliente não comparece. */
	restoreCreditOnNoShow: boolean
	/** Devolve o crédito quando o cancelamento parte do admin. */
	restoreCreditOnAdminCancellation: boolean
}

export interface ISaveAvailability {
	rules: Array<IAvailabilityRule>
}

export interface ISellPackage {
	packageId: string
	/** Sobrescreve a validade padrão do pacote. */
	expiresAt?: string
}

export interface IServiceProfessionalLink {
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
}

export interface ISetServiceProfessionals {
	professionals: Array<IServiceProfessionalLink>
}

export interface IUpdateAppointmentStatus {
	/** `pending` e `cancelled_by_client` não são atribuíveis pelo admin. */
	status: "approved" | "rejected" | "cancelled_by_admin" | "completed" | "no_show"
	/** Obrigatório ao registrar cancelamento pelo admin ou falta. */
	reason?: string
}

export interface IUpdateProfessional {
	/** Nome exibido na agenda. */
	name: string
	/** Profissionais inativos não aparecem para agendamento, mas preservam o histórico. */
	isActive?: boolean
}

export interface IUpdateService {
	name: string
	description?: string
	/** `manual` exige aprovação do admin; `automatic` confirma na hora. */
	approvalMode?: "manual" | "automatic"
	/** Como o cliente escolhe o profissional ao agendar. */
	professionalSelectionMode?: "automatic" | "optional" | "required"
	/** Preço base, em centavos. Pode ser sobrescrito por profissional. */
	unitPriceCents?: number
	isActive?: boolean
}

/** Query string de `GET /dashboard/appointments/package-contracts/{id}/ledger`. */
export interface IGetPackageLedgerQuery {
	from?: string
	to?: string
	/** Filtra por tipo de lançamento no extrato. */
	type?: "grant" | "consume" | "restore" | "expire" | "adjustment"
}

/** Query string de `GET /dashboard/appointments/blocks`. */
export interface IGetBlocksQuery {
	from?: string
	to?: string
}

/** Query string de `GET /dashboard/appointments/availability`. */
export interface IGetAvailabilityQuery {
	serviceId: string
	date: string
}

/** Query string de `GET /dashboard/appointments/analytics`. */
export interface IGetAnalyticsQuery {
	from?: string
	to?: string
	serviceId?: string
	professionalId?: string
}

/** Query string de `GET /dashboard/appointments`. */
export interface IGetListAppointmentsQuery {
	from?: string
	to?: string
}

/** Query string de `GET /dashboard/appointments/calendar`. */
export interface IGetCalendarQuery {
	from?: string
	to?: string
}
