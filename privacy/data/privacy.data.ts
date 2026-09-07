import { preSetup } from "@core/constants"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const privacyDefaults = {
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
	paramsDefault404: (token?: string) =>
		preSetup.preSetupParamsDefault(404, 5, 500, token),
	paramsDefault409: (token?: string) =>
		preSetup.preSetupParamsDefault(409, 5, 500, token),
}

/** `API-LGPD-01` — o primeiro admin do tenant nasce Principal; o segundo, não. */
export const privacyLGPD01 = {
	...privacyDefaults,
	casePrefix: "[LGPD-01]",
}

/**
 * `API-LGPD-11` — execução da retenção.
 *
 * **Parcialmente verificável**: a API não permite criar submissão com data
 * passada, então a metade "apaga a de 31 dias" não é testável por aqui. O que dá
 * para provar é a outra metade — a resposta recente **não** é apagada, mesmo com
 * a política no mínimo de 1 dia.
 * Ver https://github.com/pricaimiTech/dev.CrossHub/issues/98.
 */
export const privacyLGPD11 = {
	...privacyDefaults,
	casePrefix: "[LGPD-11]",
	caseId: "LGPD-11",
	answer: "Resposta sensível recente",
	retentionDays: 1,
	defaultRetentionDays: 365,
	/** Bem além do prazo de 1 dia. */
	expiredAgeDays: 31,
}

/** `API-LGPD-03` — só o Principal concede acesso a dados sensíveis. */
export const privacyLGPD03 = {
	...privacyDefaults,
	casePrefix: "[LGPD-03]",
	errorMessage:
		"Apenas o Administrador Principal pode alterar o acesso a dados sensíveis.",
}

/** `API-LGPD-04` — leitura de submissão sensível sem autorização. */
export const privacyLGPD04 = {
	...privacyDefaults,
	casePrefix: "[LGPD-04]",
	caseId: "LGPD-04",
	answer: "Resposta sensível",
	errorMessage:
		"Você não possui a permissão para visualizar respostas sensíveis.",
}

/** `API-LGPD-05` — envio de formulário sensível sem autorização. */
export const privacyLGPD05 = {
	...privacyDefaults,
	casePrefix: "[LGPD-05]",
	caseId: "LGPD-05",
}

/** `API-LGPD-06` — o acesso do Principal é irrevogável. */
export const privacyLGPD06 = {
	...privacyDefaults,
	casePrefix: "[LGPD-06]",
	errorMessage:
		"O Administrador Principal possui acesso permanente a dados sensíveis.",
}

/** `API-LGPD-07` — alvo inválido devolve 404, nunca 403. */
export const privacyLGPD07 = {
	...privacyDefaults,
	casePrefix: "[LGPD-07]",
	errorMessage: "Profissional não encontrado.",
	unknownUserId: "00000000-0000-0000-0000-000000000000",
}

/** `API-LGPD-08` — a autorização vale na requisição seguinte, sem novo login. */
export const privacyLGPD08 = {
	...privacyDefaults,
	casePrefix: "[LGPD-08]",
	caseId: "LGPD-08",
	answer: "Resposta sensível",
}

/** `API-LGPD-09` — a revogação vale na requisição seguinte, sem novo login. */
export const privacyLGPD09 = {
	...privacyDefaults,
	casePrefix: "[LGPD-09]",
	caseId: "LGPD-09",
	answer: "Resposta sensível",
}

/** `API-LGPD-10` — limites da retenção de dados sensíveis. */
export const privacyLGPD10 = {
	...privacyDefaults,
	casePrefix: "[LGPD-10]",
	errorMessage: "A retenção deve ser um número inteiro entre 1 e 3650 dias.",
	invalidValues: [0, 3651, -1, 3.5] as Array<number>,
	minimumValid: 1,
	maximumValid: 3650,
	defaultValue: 365,
}

/** `API-LGPD-12` — apagar e ler são controles independentes. */
export const privacyLGPD12 = {
	...privacyDefaults,
	casePrefix: "[LGPD-12]",
	retentionDays: 365,
}

/** `API-LGPD-XT` — isolamento entre tenants. */
export const privacyLGPDXT = {
	...privacyDefaults,
	casePrefix: "[LGPD-XT]",
}

/**
 * `API-LGPD-02` — **bloqueado**.
 *
 * Exige um Administrador Principal com `canViewSensitiveData: false`, estado que
 * só existe em base migrada: a API recusa revogar o acesso do Principal (409,
 * provado por `LGPD-06-F`). Ver
 * https://github.com/pricaimiTech/dev.CrossHub/issues/98.
 */

/**
 * `API-LGPD-13` — **bloqueado**.
 *
 * Depende de ler `audit_logs`, que não tem rota na API. Ver
 * https://github.com/pricaimiTech/dev.CrossHub/issues/96.
 */

/**
 * `API-LGPD-13` — conceder e revogar o acesso a dados sensíveis deixa dois
 * eventos `sensitive_data_access.updated`, com ator, alvo e o valor aplicado.
 */
export const privacyLGPD13 = {
	...privacyDefaults,
	casePrefix: "[LGPD-13]",
	caseId: "LGPD-13",
	action: "sensitive_data_access.updated",
}
