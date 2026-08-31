/**
 * Contratos do domínio `dashboard` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IDashboardHome {
	generatedAt: string
	periods: IHomePeriods
	metrics: IHomeMetrics
	todayAgenda: Array<IHomeAgendaItem>
	/** As quatro ações mais relevantes do momento. */
	actions: Array<IHomeAction>
	alerts: IHomeAlerts
	/** Eventos recentes, do mais novo para o mais antigo. */
	activities: Array<IHomeActivity>
}

export interface IDashboardSession {
	email: string
	tenantId: string
	role: "tenant_admin" | "end_user"
	/** Nulo enquanto o administrador não preenche o cadastro. */
	name: string | null
}

export interface IHomeAction {
	id: string
	priority: "high" | "medium" | "low"
	/** Identificador estável do tipo de ação. */
	type: string
	count: number
	title: string
	description: string
	destination: IHomeDestination
}

export interface IHomeActivity {
	id: string
	/** Identificador estável do tipo de evento. */
	type: string
	occurredAt: string
	title: string
	description: string
	destination: IHomeDestination
}

export interface IHomeAgendaItem {
	id: string
	startsAt: string
	personName: string
	serviceName: string
	professionalName: string
	status: "pending" | "approved" | "rejected" | "cancelled_by_client" | "cancelled_by_admin" | "completed" | "no_show"
}

export interface IHomeAlertItem {
	id: string
	title: string
	destination: IHomeDestination
}

export interface IHomeAlerts {
	items: Array<IHomeAlertItem>
	/** Subconjunto das ações de prioridade alta. */
	today: Array<IHomeAction>
	/** Reservas sem ação há mais de 48 horas. */
	overdue: Array<IHomeOverdueItem>
}

export interface IHomeDestination {
	section: "reservations" | "orders" | "people" | "responses" | "groups" | "appointments"
	/** Filtro pré-aplicado na seção de destino. */
	filter?: string
	/** Registro a destacar ao abrir a seção. */
	id?: string
	tab?: "agenda" | "blocks" | "availability"
}

export interface IHomeMetrics {
	todayAppointments: number
	pendingAppointments: number
	/** Reservas criadas nas últimas 24 horas. */
	newReservations: number
	readyForPickup: number
	newPeopleLast7Days: number
	/** Respostas recebidas nas últimas 24 horas. */
	newFormSubmissions: number
}

export interface IHomeOverdueItem {
	id: string
	title: string
	destination: IHomeDestination
	description: string
}

export interface IHomePeriods {
	/** Início da janela de 24h usada nas métricas recentes. */
	recentSince: string
	/** Início da janela de 7 dias usada na métrica de pessoas. */
	peopleSince: string
}
