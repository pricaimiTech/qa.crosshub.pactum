import { preSetup } from "@core/constants"
import { weekdayOfDate } from "@core/utils/date.utils"
import { dateForCase } from "@shared-data/testDates.data"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const calendarDefaults = {
	durationMinutes: 60,
	capacity: 5,
	cleanupReason: "Limpeza da massa de automação de API.",
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
}

/**
 * `API-AG-04` — janelas já passadas somem da consulta do dia corrente.
 *
 * A agenda cobre o dia inteiro de hoje; a asserção compara cada janela com o
 * horário atual do fuso do tenant, sem depender de um horário fixo de execução.
 */
export const calendarAG04 = {
	...calendarDefaults,
	casePrefix: "[AG-04]",
	date: dateForCase("AG-04"),
	weekday: weekdayOfDate(dateForCase("AG-04")),
	startTime: "00:00",
	endTime: "23:00",
}

/** `API-AG-27` — feriado aparece no calendário, mas não bloqueia a agenda. */
export const calendarAG27 = {
	...calendarDefaults,
	casePrefix: "[AG-27]",
	/** Feriado nacional de data fixa, sem bloqueio cadastrado. */
	holidayDate: "2026-12-25",
	holidayName: "Natal",
	holidayWeekday: weekdayOfDate("2026-12-25"),
	startTime: "08:00",
	endTime: "12:00",
	expectedSlotCount: 4,
}

/**
 * `API-AG-28` — feriados móveis em dois anos distintos.
 *
 * Datas calculadas a partir da Páscoa de cada ano; se a tabela tiver só data
 * fixa, nenhuma delas aparece.
 */
export const calendarAG28 = {
	...calendarDefaults,
	casePrefix: "[AG-28]",
	years: [
		{
			from: "2026-01-01",
			to: "2026-12-31",
			expected: [
				{ date: "2026-02-17", name: "Carnaval" },
				{ date: "2026-04-03", name: "Sexta-feira Santa" },
				{ date: "2026-06-04", name: "Corpus Christi" },
			],
		},
		{
			from: "2027-01-01",
			to: "2027-12-31",
			expected: [
				{ date: "2027-02-09", name: "Carnaval" },
				{ date: "2027-03-26", name: "Sexta-feira Santa" },
				{ date: "2027-05-27", name: "Corpus Christi" },
			],
		},
	],
}

/** `API-AG-30` — gate do add-on de indicadores. */
