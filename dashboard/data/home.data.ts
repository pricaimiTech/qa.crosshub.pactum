import { preSetup } from "@core/constants"
import { knownBugs } from "@shared-data/knownBugs.data"

/** Login responde 201, não 200 — divergência aberta na issue #86. */
const loginParams = preSetup.preSetupParamsDefault(201, 5, 500)

const homeDefaults = {
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
}

/**
 * `API-H-04` — a Home oferece no máximo quatro ações, em ordem de prioridade.
 *
 * A estratégia lista os tipos `pending_appointments`, `today_agenda`,
 * `upcoming_blocks` e `new_reservations`. Os tipos reais da API são outros —
 * `appointment_blocks` e `new_form_submissions`, por exemplo — e o contrato não
 * enumera o campo (`type` é string livre). Por isso a ordem é conferida pelo
 * campo `priority`, que a API devolve e mantém estável, e não pela lista de
 * tipos da estratégia.
 */
export const homeH04 = {
	...homeDefaults,
	maxActions: 4,
	/** Da mais urgente para a menos urgente. */
	priorityOrder: ["high", "medium", "low"] as Array<string>,
	/** A lista vem fora de ordem — vermelho até a correção. */
	knownBug: knownBugs["API-H-04"],
}

/** `API-H-05` — contagem zero não vira card. */
export const homeH05 = {
	...homeDefaults,
}

/** `API-H-06` — o feed é limitado, ordenado e sem repetição. */
export const homeH06 = {
	...homeDefaults,
	maxActivities: 10,
}

/** `API-H-07` — o feed carrega metadado, nunca o conteúdo da resposta. */
export const homeH07 = {
	...homeDefaults,
	casePrefix: "[H-07]",
	caseId: "H-07",
	secretAnswer: "Conteudo confidencial que nao pode vazar no feed",
}

/** `API-H-08` — o filtro de sensível vale para métricas, ações e feed. */
export const homeH08 = {
	...homeDefaults,
	casePrefix: "[H-08]",
	caseId: "H-08",
	secretAnswer: "Resposta sensivel que nao pode aparecer na home",
}

/** `API-H-10` — tenant vazio devolve tudo zerado, sem dado de exemplo. */
export const homeH10 = {
	...homeDefaults,
	zeroedMetrics: [
		"todayAppointments",
		"pendingAppointments",
		"newReservations",
		"readyForPickup",
		"newPeopleLast7Days",
		"newFormSubmissions",
	] as Array<string>,
}

/** `API-H-11` — sessão do painel reflete o token. */
export const homeH11 = {
	...homeDefaults,
	expectedRole: "tenant_admin",
}

/** `API-H-XT` — cada tenant vê só o próprio número. */
export const homeHXT = {
	...homeDefaults,
}

/**
 * `API-H-01`, `API-H-02` e `API-H-09` — **bloqueados**.
 *
 * Exigem massa com data no passado (reservas de 23 h e 25 h, cadastros de 6 e 8
 * dias, reservas paradas há 2 e 4 dias). A API não aceita criar registro com
 * data retroativa — mesma lacuna de
 * https://github.com/pricaimiTech/dev.CrossHub/issues/98. São os casos que
 * provam o **corte** da janela: sem eles, a suíte confirma que a janela existe e
 * tem a largura certa (`H-03`), mas não que ela exclui o que está fora.
 */

/**
 * `API-H-03` — janelas da Home.
 *
 * A estratégia descreve a virada do dia no fuso do tenant. A implementação usa
 * **janela deslizante** — `recentSince` é sempre 24 h antes de `generatedAt`, e
 * `peopleSince`, 7 dias antes — sem qualquer papel do fuso. O caso verifica o
 * comportamento real; a divergência está em
 * https://github.com/pricaimiTech/dev.CrossHub/issues/102 para decisão de produto.
 */
export const homeH03 = {
	...homeDefaults,
	recentWindowHours: 24,
	peopleWindowDays: 7,
	/** Tolerância para o tempo entre a geração da resposta e a asserção. */
	toleranceMs: 2000,
}
