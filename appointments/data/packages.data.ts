import { preSetup } from "@core/constants"
import { tenantTimezone, weekdayOfDate } from "@core/utils/date.utils"
import { dateForCase } from "@shared-data/testDates.data"
import { ANALYTICS_ADDON_CODE } from "@core/business/addons/addons.business"
import { dateInDays } from "@core/utils/date.utils"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const packageDefaults = {
	startTime: "08:00",
	endTime: "12:00",
	durationMinutes: 60,
	capacity: 5,
	timezone: tenantTimezone(),
	cleanupReason: "Limpeza da massa de automação de API.",
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault409: (token?: string) =>
		preSetup.preSetupParamsDefault(409, 5, 500, token),
}

/** `API-AG-31` — venda de pacote credita e o agendamento consome. */
export const packagesAG31 = {
	...packageDefaults,
	casePrefix: "[AG-31]",
	date: dateForCase("AG-31"),
	weekday: weekdayOfDate(dateForCase("AG-31")),
	packageName: "[AG-31] Pacote",
	priceCents: 30000,
	totalCredits: 10,
	validityDays: 90,
	creditsPerSession: 1,
	expectedGrantDelta: 10,
	expectedConsumeDelta: -1,
	expectedBalanceAfterConsume: 9,
	grantType: "grant",
	consumeType: "consume",
}

/** `API-AG-31b` — restauração excepcional de crédito. */
export const packagesAG31b = {
	...packageDefaults,
	casePrefix: "[AG-31b]",
	date: dateForCase("AG-31b"),
	weekday: weekdayOfDate(dateForCase("AG-31b")),
	packageName: "[AG-31b] Pacote",
	priceCents: 30000,
	totalCredits: 10,
	validityDays: 90,
	creditsPerSession: 1,
	/** A restauração responde 201, não 200 como o contrato declara (issue #86). */
	restoreType: "restore",
	restoreReason: "Cliente avisou com antecedência por telefone.",
	expectedReasonPrefix: "Devolução excepcional:",
	expectedBalanceAfterRestore: 10,
	cancelReason: "Cancelado pelo admin, fora da política de devolução.",
}

/**
 * `API-AG-33` — pagamento de pacote (issue #145): a venda sem pagamento deixa o
 * valor cheio em aberto; o pagamento pelo contrato abate o saldo; a venda com
 * pagamento integral nasce quitada. Pessoa e pacote são criados no próprio
 * teste, então o resumo financeiro reflete só o que o caso lançou.
 */
export const packagesAG33 = {
	...packageDefaults,
	casePrefix: "[AG-33]",
	packageName: "[AG-33] Pacote",
	priceCents: 30000,
	totalCredits: 10,
	creditsPerSession: 1,
	partialPaymentCents: 10000,
	/** Maior que o saldo depois do pagamento parcial (30000 − 10000). */
	overOutstandingCents: 25000,
	expectedOutstandingAfterPartial: 20000,
	partialMethod: "pix" as const,
	partialNotes: "[AG-33] Pagamento parcial na venda do pacote.",
	fullMethod: "cash" as const,
	paymentType: "payment",
	/** O `outstanding` do Analytics é saldo acumulado, não filtrado pelo período. */
	addOnCode: ANALYTICS_ADDON_CODE,
	analyticsPeriod: { from: dateInDays(0), to: dateInDays(0) },
	overOutstandingMessage: "O pagamento excede o saldo em aberto.",
	missingMethodMessage: "Informe a forma de pagamento.",
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
}
