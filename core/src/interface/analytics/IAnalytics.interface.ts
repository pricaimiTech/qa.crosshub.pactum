/**
 * Contratos do domínio `analytics` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IAddOnInterest {
	id: string
	kind: "contract" | "trial"
	status: "pending" | "handled"
	createdAt: string
	requestedByEmail: string | null
}

export interface IAnalyticsPeriod {
	from: string
	to: string
	timezone: string
}

export interface IAppointmentsAnalyticsCards {
	/** Nulo quando não há disponibilidade cadastrada no período. */
	occupancyPercent: number | null
	availableMinutes: number
	scheduledMinutes: number
	receivedCents: number
	outstandingCents: number
	/** Nulo quando nenhum atendimento ativo do período já passou. */
	noShowRatePercent: number | null
	noShowCount: number
	pastActiveCount: number
}

export interface IAppointmentsAnalytics {
	period: IAnalyticsPeriod
	cards: IAppointmentsAnalyticsCards
	/** Da menor para a maior ocupação; sem disponibilidade no fim. */
	professionals: Array<IProfessionalOccupancy>
	freeSlots: IFreeSlots
	weekly: Array<IWeeklyBucket>
	cancellations: ICancellations
}

export interface ICancellations {
	byClient: number
	byAdmin: number
	rejected: number
}

export interface IChurnRiskCustomer {
	personId: string
	name: string
	email: string | null
	phone: string | null
	lastAppointmentAt: string
	daysSince: number
}

export interface ICustomersAnalyticsCards {
	activeCustomers: number
	newCustomers: number
	/** Nulo sem clientes ativos. */
	averageTicketCents: number | null
	/** Nulo sem clientes ativos. */
	recurrencePercent: number | null
	/** Soma do saldo em aberto de todos os clientes, hoje. Independe do período. */
	outstandingCents: number
	/** Clientes com algum saldo em aberto. */
	customersWithBalance: number
}

export interface ICustomersAnalytics {
	period: IAnalyticsPeriod
	cards: ICustomersAnalyticsCards
	/** As dez pessoas com maior receita recebida no período. */
	topSpenders: Array<ITopSpender>
	/** Sem atendimento há mais de 60 dias, com atendimento nos 12 meses anteriores. */
	churnRisk: Array<IChurnRiskCustomer>
	/** Clientes com saldo em aberto hoje, do maior para o menor. Independe do período. */
	outstanding: Array<IOutstandingCustomer>
}

export interface IFreeMinutesByWeekday {
	/** 0 = domingo … 6 = sábado. */
	weekday: number
	freeMinutes: number
}

export interface IFreeSlots {
	/** Os cinco profissionais com mais horas livres. */
	items: Array<IFreeSlotsItem>
	othersFreeMinutes: number
	othersCount: number
}

export interface IFreeSlotsItem {
	professionalId: string
	professionalName: string
	freeMinutes: number
	byWeekday: Array<IFreeMinutesByWeekday>
}

export interface IInterestAddOn {
	code: string
	name: string
	/** Preço de referência do catálogo, em centavos, exibido na tela de bloqueio. */
	priceCents: number
}

export interface IOutstandingCustomer {
	personId: string
	name: string
	email: string | null
	phone: string | null
	/** Atendimentos mais pacotes. */
	outstandingCents: number
	/** Atendimentos não pagos ou pagos em parte. */
	appointmentsCents: number
	/** Pacotes vendidos e não quitados. */
	packagesCents: number
	/** Quantidade de atendimentos e pacotes com saldo. */
	items: number
	/** Data do item em aberto mais antigo. */
	oldestAt: string
}

export interface IPendingInterest {
	pending: IAddOnInterest
	/** Null se o add-on não estiver no catálogo. */
	addon: IInterestAddOn
}

export interface IProfessionalOccupancy {
	id: string
	name: string
	occupancyPercent: number | null
	availableMinutes: number
	scheduledMinutes: number
	/** `false` para profissional sem disponibilidade cadastrada; ele não entra na média. */
	hasAvailability: boolean
}

export interface IRequestInterest {
	/** `contract` = quero contratar; `trial` = quero testar. */
	kind: "contract" | "trial"
}

export interface IRequestedInterest {
	id: string
	kind: "contract" | "trial"
	status: "pending" | "handled"
	createdAt: string
	requestedByEmail: string | null
	/** `true` quando um pedido pendente com menos de 7 dias foi reaproveitado (200); `false` quando criou (201). */
	reused: boolean
}

export interface ITopSpender {
	personId: string
	name: string
	/** Nulo quando o administrador não pode ver dado sensível. */
	email: string | null
	/** Nulo quando o administrador não pode ver dado sensível. */
	phone: string | null
	receivedCents: number
	appointments: number
}

export interface IWeeklyBucket {
	/** Segunda-feira da semana. */
	weekStart: string
	noShow: number
	cancelledByClient: number
	cancelledByAdmin: number
	rejected: number
	completed: number
}

/** Query string de `GET /dashboard/analytics/appointments`. */
export interface IGetAppointmentsAnalyticsQuery {
	from: string
	to: string
}

/** Query string de `GET /dashboard/analytics/appointments/export`. */
export interface IGetAppointmentsAnalyticsExportQuery {
	from: string
	to: string
}

/** Query string de `GET /dashboard/analytics/customers`. */
export interface IGetCustomersAnalyticsQuery {
	from: string
	to: string
}

/** Query string de `GET /dashboard/analytics/customers/export`. */
export interface IGetCustomersAnalyticsExportQuery {
	from: string
	to: string
}
