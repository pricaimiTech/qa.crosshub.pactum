import { preSetup } from "@core/constants"
import { hourWindowFromNow, tenantTimezone } from "@core/utils/date.utils"
import { dateForCase, datesForCase } from "@shared-data/testDates.data"
import { weekdayOfDate } from "@core/utils/date.utils"

/** Senha numérica usada em toda ativação de cliente final desta suíte. */
const endUserPassword = "1234"

/**
 * Login responde **201**, não 200 como o `openapi.json` declara — divergência
 * aberta em https://github.com/pricaimiTech/dev.CrossHub/issues/86.
 */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

/** Base comum a todos os casos de reserva do cliente final. */
const bookingDefaults = {
	/**
	 * `POST /public/me/appointments/{id}/cancel` responde **201**, não 200 como o
	 * contrato declara — mesma divergência dos logins (issue #86).
	 */
	cancelStatus: 201,
	/** Motivo registrado ao limpar a massa da execução anterior. */
	cleanupReason: "Limpeza da massa de automação de API.",
	startTime: "08:00",
	endTime: "12:00",
	durationMinutes: 60,
	endUserPassword,
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
	paramsDefault409: (token?: string) =>
		preSetup.preSetupParamsDefault(409, 5, 500, token),
}

/** `API-AG-11` — serviço com aprovação automática nasce `approved`. */
export const bookingAG11 = {
	...bookingDefaults,
	casePrefix: "[AG-11]",
	caseId: "AG-11",
	date: dateForCase("AG-11"),
	weekday: weekdayOfDate(dateForCase("AG-11")),
	capacity: 5,
	approvalMode: "automatic" as const,
	expectedStatus: "approved",
}

/** `API-AG-07` — cota de um agendamento por dia para o cliente. */
export const bookingAG07 = {
	...bookingDefaults,
	casePrefix: "[AG-07]",
	caseId: "AG-07",
	date: dateForCase("AG-07"),
	weekday: weekdayOfDate(dateForCase("AG-07")),
	capacity: 5,
	approvalMode: "manual" as const,
	errorMessage:
		"Para realizar outro agendamento neste dia, entre em contato com a administração.",
}

/** `API-AG-08` — agendamento cancelado libera a cota diária. */
export const bookingAG08 = {
	...bookingDefaults,
	casePrefix: "[AG-08]",
	caseId: "AG-08",
	date: dateForCase("AG-08"),
	weekday: weekdayOfDate(dateForCase("AG-08")),
	capacity: 5,
	/**
	 * Aprovação automática de propósito: o cancelamento pelo cliente só é aceito
	 * em agendamento `approved` — em `pending` a API responde 409 "Este
	 * agendamento não pode ser cancelado."
	 */
	approvalMode: "automatic" as const,
	cancelReason: "Desistiu do horário.",
}

/** `API-AG-10` — aprovação manual nasce `pending` e já consome capacidade. */
export const bookingAG10 = {
	...bookingDefaults,
	casePrefix: "[AG-10]",
	caseId: "AG-10",
	date: dateForCase("AG-10"),
	weekday: weekdayOfDate(dateForCase("AG-10")),
	capacity: 5,
	approvalMode: "manual" as const,
	expectedStatus: "pending",
	expectedOccupied: 1,
}

/** `API-AG-17` — capacidade esgotada recusa a próxima reserva. */
export const bookingAG17 = {
	...bookingDefaults,
	casePrefix: "[AG-17]",
	caseId: "AG-17",
	date: dateForCase("AG-17"),
	weekday: weekdayOfDate(dateForCase("AG-17")),
	capacity: 5,
	approvalMode: "manual" as const,
	expectedOccupied: 5,
}

/** `API-AG-09` — a cota diária vale para o cliente, não para o admin. */
export const bookingAG09 = {
	...bookingDefaults,
	casePrefix: "[AG-09]",
	caseId: "AG-09",
	date: dateForCase("AG-09"),
	weekday: weekdayOfDate(dateForCase("AG-09")),
	capacity: 5,
	approvalMode: "manual" as const,
	personPrefix: "[AG-09]",
}

/** `API-AG-23` — estados finais não voltam. */
export const bookingAG23 = {
	...bookingDefaults,
	casePrefix: "[AG-23]",
	caseId: "AG-23",
	date: dateForCase("AG-23"),
	weekday: weekdayOfDate(dateForCase("AG-23")),
	capacity: 5,
	approvalMode: "automatic" as const,
	finalStatus: "completed" as const,
	forbiddenStatus: "approved" as const,
	errorMessage: "Essa alteração de status não é permitida.",
}

/** `API-AG-24` — bloqueio impede novas reservas, mas não mexe no passado. */
export const bookingAG24 = {
	...bookingDefaults,
	casePrefix: "[AG-24]",
	caseId: "AG-24",
	date: dateForCase("AG-24"),
	weekday: weekdayOfDate(dateForCase("AG-24")),
	capacity: 5,
	approvalMode: "automatic" as const,
	blockReason: "Manutenção da sala.",
	expectedStatus: "approved",
}

/** `API-AG-22` — reagendamento pelo cliente não existe na API. */
export const bookingAG22 = {
	...bookingDefaults,
	casePrefix: "[AG-22]",
	caseId: "AG-22",
	date: dateForCase("AG-22"),
	weekday: weekdayOfDate(dateForCase("AG-22")),
	capacity: 5,
	approvalMode: "automatic" as const,
	rescheduleReason: "Quero outro horário.",
	paramsDefault404: (token?: string) =>
		preSetup.preSetupParamsDefault(404, 5, 500, token),
}

/** `API-AG-32` — notas internas e motivo de bloqueio não vazam para o app. */
export const bookingAG32 = {
	...bookingDefaults,
	casePrefix: "[AG-32]",
	caseId: "AG-32",
	date: dateForCase("AG-32"),
	weekday: weekdayOfDate(dateForCase("AG-32")),
	capacity: 5,
	approvalMode: "automatic" as const,
	internalNote: "Nota interna: cliente devendo mensalidade.",
	blockReason: "Motivo interno: sala interditada.",
}

/** `API-AG-15` — só entra na distribuição quem gera aquela janela. */
export const bookingAG15 = {
	...bookingDefaults,
	casePrefix: "[AG-15]",
	caseId: "AG-15",
	date: dateForCase("AG-15"),
	weekday: weekdayOfDate(dateForCase("AG-15")),
	capacity: 5,
	approvalMode: "automatic" as const,
	/** O segundo profissional atende só à tarde, fora da janela consultada. */
	idleStartTime: "14:00",
	idleEndTime: "18:00",
	idleShift: "afternoon" as const,
}

/**
 * `API-AG-16` — disputa pela última vaga.
 *
 * A especificação pede 20 repetições. Cada rodada roda em uma data própria,
 * porque a cota de um agendamento por dia impediria o mesmo par de clientes de
 * disputar duas vezes no mesmo dia. A agenda cobre os sete dias da semana para
 * que qualquer data da faixa gere janela.
 */
export const bookingAG16 = {
	...bookingDefaults,
	casePrefix: "[AG-16]",
	caseId: "AG-16",
	/** Última vaga: a disputa só existe com capacidade 1. */
	capacity: 1,
	approvalMode: "automatic" as const,
	rounds: 20,
	dates: datesForCase("AG-16"),
	weekdays: [0, 1, 2, 3, 4, 5, 6] as Array<number>,
	expectedRound: [201, 409] as Array<number>,
}

/**
 * `API-AG-19` — prazo de cancelamento do cliente.
 *
 * Com `cancellationNoticeHours: 24`, cancelar dentro do prazo é recusado e fora
 * dele é aceito. As duas janelas são ancoradas em hora cheia: a de dentro fica a
 * ~23 h do início (o arredondamento só aproxima) e a de fora, a mais de 25 h.
 */
export const bookingAG19 = {
	...bookingDefaults,
	casePrefix: "[AG-19]",
	caseId: "AG-19",
	date: dateForCase("AG-19"),
	weekday: weekdayOfDate(dateForCase("AG-19")),
	capacity: 5,
	approvalMode: "automatic" as const,
	cancellationNoticeHours: 24,
	timezone: tenantTimezone(),
	insideWindow: hourWindowFromNow(23),
	outsideWindow: hourWindowFromNow(26),
	cancelReason: "Não vou conseguir comparecer.",
	errorMessage:
		"Para cancelar com menos de 24 horas de antecedência, entre em contato com a administração.",
}

/** `API-AG-20` — o prazo de cancelamento restringe o cliente, não o admin. */
export const bookingAG20 = {
	...bookingDefaults,
	casePrefix: "[AG-20]",
	capacity: 5,
	approvalMode: "automatic" as const,
	/** Começa dentro do prazo de 24 h, onde o cliente já seria recusado. */
	imminentWindow: hourWindowFromNow(2),
	cancellationNoticeHours: 24,
	timezone: tenantTimezone(),
	cancelReason: "Profissional passou mal.",
	expectedStatus: "cancelled_by_admin",
}

/** `API-AG-21` — reagendamento encadeia original e novo. */
export const bookingAG21 = {
	...bookingDefaults,
	casePrefix: "[AG-21]",
	date: dateForCase("AG-21"),
	weekday: weekdayOfDate(dateForCase("AG-21")),
	capacity: 5,
	approvalMode: "automatic" as const,
	rescheduleReason: "Profissional remanejado.",
	cancelledStatus: "cancelled_by_admin",
}

/** `API-AG-12` — serviço com escolha automática rejeita profissional explícito. */
export const bookingAG12 = {
	...bookingDefaults,
	casePrefix: "[AG-12]",
	caseId: "AG-12",
	date: dateForCase("AG-12"),
	weekday: weekdayOfDate(dateForCase("AG-12")),
	capacity: 5,
	approvalMode: "automatic" as const,
	selectionMode: "automatic" as const,
}

/** `API-AG-13` — serviço que exige escolha rejeita a omissão do profissional. */
export const bookingAG13 = {
	...bookingDefaults,
	casePrefix: "[AG-13]",
	caseId: "AG-13",
	date: dateForCase("AG-13"),
	weekday: weekdayOfDate(dateForCase("AG-13")),
	capacity: 5,
	approvalMode: "automatic" as const,
	selectionMode: "required" as const,
	expectedAvailabilityStatus: 400,
}

/** `API-AG-14` — desempate da distribuição automática é determinístico. */
export const bookingAG14 = {
	...bookingDefaults,
	casePrefix: "[AG-14]",
	caseId: "AG-14",
	capacity: 5,
	approvalMode: "automatic" as const,
	/** Cinco execuções, uma por data, para provar que o resultado não varia. */
	rounds: 5,
	dates: datesForCase("AG-14"),
	weekdays: [0, 1, 2, 3, 4, 5, 6] as Array<number>,
}

/** `API-AG-18` — cancelar libera a vaga da janela lotada. */
export const bookingAG18 = {
	...bookingDefaults,
	casePrefix: "[AG-18]",
	caseId: "AG-18",
	date: dateForCase("AG-18"),
	weekday: weekdayOfDate(dateForCase("AG-18")),
	/** Vaga única para esgotar a capacidade com um agendamento só. */
	capacity: 1,
	approvalMode: "automatic" as const,
	cancelReason: "Desistiu do horário.",
}

/** `API-AG-25` — bloquear um dos profissionais não fecha a janela. */
export const bookingAG25 = {
	...bookingDefaults,
	casePrefix: "[AG-25]",
	caseId: "AG-25",
	date: dateForCase("AG-25"),
	weekday: weekdayOfDate(dateForCase("AG-25")),
	capacity: 5,
	approvalMode: "automatic" as const,
	blockReason: "Consulta externa.",
}
