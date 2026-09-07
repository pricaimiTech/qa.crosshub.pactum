import { preSetup } from "@core/constants"
import { hourWindowFromNow, weekdayOfDate } from "@core/utils/date.utils"
import { dateForCase } from "@shared-data/testDates.data"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const validationDefaults = {
	startTime: "08:00",
	endTime: "12:00",
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
	paramsDefault409: (token?: string) =>
		preSetup.preSetupParamsDefault(409, 5, 500, token),
}

/** `API-AG-06` — limites do vínculo serviço–profissional. */
export const validationsAG06 = {
	...validationDefaults,
	casePrefix: "[AG-06]",
	date: dateForCase("AG-06"),
	weekday: weekdayOfDate(dateForCase("AG-06")),
	errorMessage: "Configuração de profissional inválida.",
	/** Uma variação por campo, cada uma violando o mínimo do contrato. */
	invalidDuration: 0,
	invalidInterval: -1,
	invalidCapacity: 0,
	invalidUnitPrice: -1,
}

/** `API-AG-21b` — reagendamento exige horário e motivo. */
export const validationsAG21b = {
	...validationDefaults,
	casePrefix: "[AG-21b]",
	date: dateForCase("AG-21b"),
	weekday: weekdayOfDate(dateForCase("AG-21b")),
	errorMessage: "Informe novo horário e motivo da remarcação.",
	rescheduleReason: "Cliente pediu outro horário.",
}

/** `API-AG-23b` — status inválido e motivo obrigatório. */
export const validationsAG23b = {
	...validationDefaults,
	casePrefix: "[AG-23b]",
	date: dateForCase("AG-23b"),
	weekday: weekdayOfDate(dateForCase("AG-23b")),
	notAssignableStatus: "pending",
	invalidStatusMessage: "Status inválido.",
	missingReasonStatus: "cancelled_by_admin" as const,
	missingReasonMessage: "Informe o motivo para registrar este status.",
}

/** `API-AG-26` — bloqueio precisa de profissional ou serviço. */
export const validationsAG26 = {
	...validationDefaults,
	casePrefix: "[AG-26]",
	date: dateForCase("AG-26"),
	weekday: weekdayOfDate(dateForCase("AG-26")),
	errorMessage: "Selecione um profissional ou serviço para bloquear.",
	/** Faixa qualquer no futuro: o caso testa a ausência de alvo, não o horário. */
	blockWindow: (() => {
		const window = hourWindowFromNow(48)
		return {
			startsAt: `${window.date}T${window.startTime}:00.000Z`,
			endsAt: `${window.date}T${window.endTime}:00.000Z`,
		}
	})(),
}

/** `API-AG-29` — profissional com histórico não pode ser excluído. */
export const validationsAG29 = {
	...validationDefaults,
	casePrefix: "[AG-29]",
	date: dateForCase("AG-29"),
	weekday: weekdayOfDate(dateForCase("AG-29")),
	errorMessage:
		"Este profissional possui agendamentos e não pode ser excluído. Inative-o para preservar o histórico.",
}
