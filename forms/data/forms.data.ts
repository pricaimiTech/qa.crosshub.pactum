import { preSetup } from "@core/constants"
import { knownBugs } from "@shared-data/knownBugs.data"

/** Login responde 201, não 200 — divergência aberta na issue #86. */
const loginParams = preSetup.preSetupParamsDefault(201, 5, 500)

const formDefaults = {
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
	paramsDefaultStatus: (statusCode: number, token?: string) =>
		preSetup.preSetupParamsDefault(statusCode, 5, 500, token),
}

/** `API-F-01` — publicar exige ao menos uma pergunta. */
export const formsF01 = {
	...formDefaults,
	casePrefix: "[F-01]",
}

/** `API-F-02` — ciclo completo de estados do formulário. */
export const formsF02 = {
	...formDefaults,
	casePrefix: "[F-02]",
	expectedCycle: [
		"PUBLISHED",
		"UNPUBLISHED",
		"PUBLISHED",
		"CLOSED",
		"ARCHIVED",
	] as Array<string>,
}

/** `API-F-03` — CLOSED é definitivo; a saída é duplicar. */
export const formsF03 = {
	...formDefaults,
	casePrefix: "[F-03]",
	/** A recusa vem como 409, a especificação pede 400 — vermelho até a decisão. */
	knownBug: knownBugs["API-F-03"],
	draftStatus: "DRAFT",
	expectedResponses: 0,
}

/** `API-F-07` — o PUT de perguntas substitui, não faz merge. */
export const formsF07 = {
	...formDefaults,
	casePrefix: "[F-07]",
	initialQuestionCount: 3,
	finalQuestionCount: 1,
	remainingTitle: "Única pergunta que sobra",
}

/** `API-F-08` — perguntas travam depois da primeira resposta. */
export const formsF08 = {
	...formDefaults,
	casePrefix: "[F-08]",
	caseId: "F-08",
	answer: "Resposta do cliente",
}

/** `API-F-15` — submissão única não aceita a segunda resposta. */
export const formsF15 = {
	...formDefaults,
	casePrefix: "[F-15]",
	caseId: "F-15",
	submissionMode: "ONCE_PER_PERSON" as const,
	/** A trigger do banco vaza como 500 — vermelho até a correção. */
	knownBug: knownBugs["API-F-15"],
	answer: "Primeira resposta",
	secondAnswer: "Segunda resposta",
}

/** `API-F-18` — formulário SPECIFIC some para quem não tem atribuição. */
export const formsF18 = {
	...formDefaults,
	casePrefix: "[F-18]",
	caseId: "F-18",
	/** O acesso direto vem como 404, a especificação pede 403. */
	knownBug: knownBugs["API-F-18"],
}

/** `API-F-09` — publicar para todos os ativos é operação atômica. */
export const formsF09 = {
	...formDefaults,
	casePrefix: "[F-09]",
	personPrefix: "[F-09]",
	activePeopleCount: 5,
}

/** `API-F-10` — "todos os ativos" é fotografia, não audiência dinâmica. */
export const formsF10 = {
	...formDefaults,
	casePrefix: "[F-10]",
	personPrefix: "[F-10]",
	peopleBeforePublish: 2,
}

/** `API-F-13` — uma pessoa inválida aborta o lote inteiro de atribuições. */
export const formsF13 = {
	...formDefaults,
	casePrefix: "[F-13]",
	personPrefix: "[F-13]",
	validPeopleCount: 4,
	expectedAssignments: 0,
}

/** `API-F-19` — respostas sensíveis exigem permissão explícita. */
export const formsF19 = {
	...formDefaults,
	casePrefix: "[F-19]",
	caseId: "F-19",
	errorMessage:
		"Você não possui a permissão para visualizar respostas sensíveis.",
}

/**
 * `API-F-20` — o filtro de sensível acontece antes da contagem.
 *
 * O agregado também precisa esconder: `total` não pode contar o que a lista não
 * mostra, senão o admin restrito descobre quantas respostas sensíveis existem.
 */
export const formsF20 = {
	...formDefaults,
	casePrefix: "[F-20]",
	caseId: "F-20",
}

/** `API-F-XT` — isolamento entre tenants. */
export const formsFXT = {
	...formDefaults,
	casePrefix: "[F-XT]",
}

/** `API-F-04` — encerrar só faz sentido a partir de publicado. */
export const formsF04 = {
	...formDefaults,
	casePrefix: "[F-04]",
	/**
	 * A estratégia registra **401** para a recusa em DRAFT, mas 401 é falha de
	 * autenticação — e a chamada é autenticada. A API responde **409**, coerente
	 * com "estado incompatível". Tratado aqui como erro de digitação da
	 * estratégia; confirmar com quem a mantém.
	 */
	draftCloseStatus: 409,
}

/** `API-F-05` — pergunta de escolha exige ao menos duas opções. */
export const formsF05 = {
	...formDefaults,
	casePrefix: "[F-05]",
	singleOptionLabel: "Única opção",
}

/** `API-F-06` — o título da pergunta tem limite de 300 caracteres. */
export const formsF06 = {
	...formDefaults,
	casePrefix: "[F-06]",
	titleAtLimit: "T".repeat(300),
	titleOverLimit: "T".repeat(301),
}

/** `API-F-11` — reenviar atribuição não duplica. */
export const formsF11 = {
	...formDefaults,
	casePrefix: "[F-11]",
	personPrefix: "[F-11]",
	expectedAssignments: 1,
}

/** `API-F-12` — estado da atribuição reflete quem respondeu. */
export const formsF12 = {
	...formDefaults,
	casePrefix: "[F-12]",
	caseId: "F-12",
	personPrefix: "[F-12]",
	completedStatus: "COMPLETED",
	availableStatus: "AVAILABLE",
	answer: "Resposta do cliente",
}

/** `API-F-16` — formulário MULTIPLE aceita mais de uma resposta. */
export const formsF16 = {
	...formDefaults,
	casePrefix: "[F-16]",
	caseId: "F-16",
	submissionMode: "MULTIPLE" as const,
	firstAnswer: "Primeira resposta",
	secondAnswer: "Segunda resposta",
	expectedSubmissions: 2,
}

/** `API-F-17` — corpo de submissão inválido. */
export const formsF17 = {
	...formDefaults,
	casePrefix: "[F-17]",
	caseId: "F-17",
	answer: "Resposta",
}

/** `API-F-22` — paginação da lista de submissões. */
export const formsF22 = {
	...formDefaults,
	casePrefix: "[F-22]",
	caseId: "F-22",
	/**
	 * Massa própria e consulta filtrada por pessoa: o tenant é compartilhado e
	 * outros casos criam submissões o tempo todo, então comparar o `total` global
	 * entre duas chamadas seria uma corrida.
	 */
	submissionMode: "MULTIPLE" as const,
	submissionCount: 3,
	answer: "Resposta paginada",
	pageSize: 2,
	expectedTotalPages: 2,
	pageSizeGlobal: 25,
	/** O contrato declara `maximum: 100` para `pageSize`. */
	pageSizeOverLimit: 200,
	pageBeyondEnd: 999,
}

/** `API-F-24` — `/dashboard/forms/submissions` não colide com `/{id}/questions`. */
export const formsF24 = {
	...formDefaults,
	casePrefix: "[F-24]",
}

/** `API-F-14` — envio por grupo marca origem e rótulo em cada atribuição. */
export const formsF14 = {
	...formDefaults,
	casePrefix: "[F-14]",
	personPrefix: "[F-14]",
	groupName: "[F-14] Turma",
	memberCount: 3,
	sourceType: "GROUP" as const,
	sourceLabel: "[F-14] Turma",
}

/**
 * `API-F-21` — leitura de resposta sensível é auditada.
 *
 * **Bloqueado**: a API não expõe rota de leitura da trilha de auditoria, então
 * não há como verificar o registro `sensitive_submission.viewed`.
 * Ver https://github.com/pricaimiTech/dev.CrossHub/issues/96.
 */
export const formsF21 = {
	...formDefaults,
	casePrefix: "[F-21]",
	caseId: "F-21",
	answer: "Resposta sensível auditada",
	auditAction: "sensitive_submission.viewed",
}

/**
 * `API-F-23` — indicadores de escala.
 *
 * Três respostas com valores conhecidos: a média sai de 1, 3 e 5.
 */
export const formsF23 = {
	...formDefaults,
	casePrefix: "[F-23]",
	caseId: "F-23",
	scaleValues: [1, 3, 5] as Array<number>,
	expectedAverage: 3,
	expectedDistributionPercent: 100,
	/** Com três respostas a soma fecha em 99 — vermelho até a correção. */
	knownBug: knownBugs["API-F-23"],
}
