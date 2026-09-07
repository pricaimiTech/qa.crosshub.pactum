import { preSetup } from "@core/constants"
import { dateInDays, weekdayOfDate } from "@core/utils/date.utils"

/**
 * Data de referência das consultas de disponibilidade: uma semana à frente,
 * longe da regra que omite janelas já passadas (coberta por `AG-04`).
 */
const referenceDate = dateInDays(7)

/**
 * Login do admin do tenant responde **201**, não 200 como o `openapi.json`
 * declara — divergência aberta em
 * https://github.com/pricaimiTech/dev.CrossHub/issues/86.
 */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

/** `API-AG-01` — geração de janelas sem intervalo. */
export const availabilityAG01 = {
	casePrefix: "[AG-01]",
	date: referenceDate,
	weekday: weekdayOfDate(referenceDate),
	startTime: "08:00",
	endTime: "12:00",
	durationMinutes: 60,
	intervalMinutes: 0,
	capacity: 5,
	expectedSlots: ["08:00", "09:00", "10:00", "11:00"] as Array<string>,
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
}

/** `API-AG-02` — o intervalo entra no passo do cursor, não na checagem de cabimento. */
export const availabilityAG02 = {
	casePrefix: "[AG-02]",
	date: referenceDate,
	weekday: weekdayOfDate(referenceDate),
	startTime: "07:00",
	endTime: "12:00",
	durationMinutes: 60,
	intervalMinutes: 5,
	capacity: 1,
	/** A próxima seria 11:20 e terminaria 12:20, além do fim do turno. */
	expectedSlots: ["07:00", "08:05", "09:10", "10:15"] as Array<string>,
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
}

/** `API-AG-03` — atendimento maior que o turno não gera nenhuma janela. */
export const availabilityAG03 = {
	casePrefix: "[AG-03]",
	date: referenceDate,
	weekday: weekdayOfDate(referenceDate),
	startTime: "08:00",
	endTime: "09:00",
	durationMinutes: 90,
	intervalMinutes: 0,
	capacity: 1,
	expectedSlots: [] as Array<string>,
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
}

/**
 * `API-AG-05` — duas regras que se cruzam no mesmo dia da semana devem ser
 * recusadas com 400, sem persistir nada (a operação é atômica).
 */
export const availabilityAG05 = {
	casePrefix: "[AG-05]",
	weekday: weekdayOfDate(referenceDate),
	baselineStartTime: "08:00",
	baselineEndTime: "12:00",
	/** Cruza a baseline a partir das 11:00. */
	overlappingStartTime: "11:00",
	overlappingEndTime: "15:00",
	expectedRuleCount: 1,
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
}
