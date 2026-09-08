import { preSetup } from "@core/constants"
import { ANALYTICS_ADDON_CODE } from "@core/business/addons/addons.business"
import { dateInDays, weekdayOfDate } from "@core/utils/date.utils"
import { dateForCase } from "@shared-data/testDates.data"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

/**
 * Base dos casos do Analytics.
 *
 * O add-on é estado global do tenant (`tenant_add_ons`, uma linha por par
 * tenant–add-on): ligar e desligar em paralelo no mesmo tenant derrubaria os
 * casos vizinhos. Por isso cada caso que muda o status usa o seu próprio tenant
 * (`tenantFor(caseId)`); os que só precisam do add-on **ativo** compartilham o
 * tenant principal e o deixam ativo ao terminar.
 */
const analyticsDefaults = {
	addOnCode: ANALYTICS_ADDON_CODE,
	cleanupReason: "Limpeza da massa de automação de API.",
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
	paramsDefault403: (token?: string) =>
		preSetup.preSetupParamsDefault(403, 5, 500, token),
}

/** `API-ANL-01` — a sessão declara os add-ons válidos e os módulos do plano. */
export const analyticsANL01 = {
	...analyticsDefaults,
	caseId: "ANL-01",
	casePrefix: "[ANL-01]",
}

/**
 * `API-ANL-02` — pedido de interesse idempotente: o segundo pedido em 7 dias
 * reaproveita o primeiro. Ativar o add-on no `before` atende qualquer pedido
 * pendente da execução anterior, senão o primeiro POST já viria com 200.
 */
export const analyticsANL02 = {
	...analyticsDefaults,
	caseId: "ANL-02",
	casePrefix: "[ANL-02]",
	kind: "trial" as const,
}

/** `API-ANL-03` — as quatro rotas do Analytics recusam o tenant sem o add-on. */
export const analyticsANL03 = {
	...analyticsDefaults,
	caseId: "ANL-03",
	casePrefix: "[ANL-03]",
	period: { from: dateInDays(0), to: dateInDays(7) },
	errorMessage: "O add-on Analytics não está ativo para esta organização.",
}

/**
 * `API-ANL-03b` — 10 h de agenda num dia, 4 atendimentos aprovados de 60 min:
 * ocupação de 40%. A cota de um agendamento por pessoa por dia exige quatro
 * clientes distintos.
 */
export const analyticsANL03b = {
	...analyticsDefaults,
	caseId: "ANL-03b",
	casePrefix: "[ANL-03b]",
	date: dateForCase("ANL-03b"),
	weekday: weekdayOfDate(dateForCase("ANL-03b")),
	startTime: "08:00",
	endTime: "18:00",
	durationMinutes: 60,
	appointments: 4,
	expectedAvailableMinutes: 600,
	expectedScheduledMinutes: 240,
	expectedOccupancyPercent: 40,
}

/**
 * `API-ANL-03c` — o bloqueio de 2 h sai do denominador: 10 h − 2 h = 8 h de
 * agenda, 4 h atendidas, ocupação de 50%. O bloqueio ocupa as duas últimas
 * janelas do dia (16:00–18:00) e os atendimentos, as quatro primeiras.
 */
export const analyticsANL03c = {
	...analyticsDefaults,
	caseId: "ANL-03c",
	casePrefix: "[ANL-03c]",
	date: dateForCase("ANL-03c"),
	weekday: weekdayOfDate(dateForCase("ANL-03c")),
	startTime: "08:00",
	endTime: "18:00",
	durationMinutes: 60,
	appointments: 4,
	blockReason: "[ANL-03c] Bloqueio de 2 h",
	/** Índices das janelas de 60 min que o bloqueio cobre: 16:00 e 17:00. */
	blockFirstSlotIndex: 8,
	blockLastSlotIndex: 9,
	expectedAvailableMinutes: 480,
	expectedScheduledMinutes: 240,
	expectedOccupancyPercent: 50,
}

/** `API-ANL-04` — período acima de 366 dias é recusado. */
export const analyticsANL04 = {
	...analyticsDefaults,
	caseId: "ANL-04",
	casePrefix: "[ANL-04]",
	period: { from: dateInDays(0), to: dateInDays(400) },
	errorMessage: "Período máximo de 12 meses.",
}

/**
 * `API-ANL-05` — a aba Clientes mascara e-mail e telefone para o admin sem
 * `canViewSensitiveData`. O período é o dia reservado ao caso, então a lista
 * de maiores clientes contém só a pessoa criada aqui.
 */
export const analyticsANL05 = {
	...analyticsDefaults,
	caseId: "ANL-05",
	casePrefix: "[ANL-05]",
	date: dateForCase("ANL-05"),
	weekday: weekdayOfDate(dateForCase("ANL-05")),
	startTime: "08:00",
	endTime: "12:00",
}

/** `API-ANL-06` — liberar o add-on marca o pedido pendente como atendido. */
export const analyticsANL06 = {
	...analyticsDefaults,
	caseId: "ANL-06",
	casePrefix: "[ANL-06]",
	kind: "contract" as const,
}
