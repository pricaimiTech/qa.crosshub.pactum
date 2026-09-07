import { preSetup } from "@core/constants"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const groupDefaults = {
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
	paramsDefault404: (token?: string) =>
		preSetup.preSetupParamsDefault(404, 5, 500, token),
}

/** `API-G-01` — criação manual preserva quantidade e ordem. */
export const groupsG01 = {
	...groupDefaults,
	casePrefix: "[G-01]",
	personPrefix: "[G-01]",
	memberCount: 3,
	expectedGroups: 1,
}

/** `API-G-02` — o modo manual exige ao menos uma pessoa válida. */
export const groupsG02 = {
	...groupDefaults,
	casePrefix: "[G-02]",
	errorMessage: "Selecione ao menos uma pessoa válida.",
}

/** `API-G-03` — pessoa de outro tenant invalida a criação inteira. */
export const groupsG03 = {
	...groupDefaults,
	casePrefix: "[G-03]",
	personPrefix: "[G-03]",
	validMemberCount: 2,
}

/** `API-G-04` — grupo de formulário exige formulário encerrado. */
export const groupsG04 = {
	...groupDefaults,
	casePrefix: "[G-04]",
	caseId: "G-04",
	answer: "Resposta do respondente",
}

/** `API-G-05` — quem respondeu várias vezes entra uma vez só. */
export const groupsG05 = {
	...groupDefaults,
	casePrefix: "[G-05]",
	caseId: "G-05",
	submissionMode: "MULTIPLE" as const,
	submissionCount: 3,
	answer: "Resposta repetida",
	expectedParticipants: 1,
}

/** `API-G-06` — formulário encerrado sem respondente não vira grupo. */
export const groupsG06 = {
	...groupDefaults,
	casePrefix: "[G-06]",
}

/**
 * `API-G-07` — divisão sequencial descarta o excedente.
 *
 * 25 pessoas em 4 grupos de 12: cabem 48, mas a API preenche em sequência e
 * cria só os grupos que receberam gente — 12, 12 e 1.
 */
export const groupsG07 = {
	...groupDefaults,
	casePrefix: "[G-07]",
	personPrefix: "[G-07]",
	memberCount: 25,
	groupCount: 4,
	groupSize: 12,
	expectedSizes: [12, 12, 1] as Array<number>,
}

/** `API-G-08` — a estratégia é rótulo, não algoritmo. */
export const groupsG08 = {
	...groupDefaults,
	casePrefix: "[G-08]",
	personPrefix: "[G-08]",
	memberCount: 6,
	strategies: ["random", "balanced", "similar"] as Array<
		"random" | "balanced" | "similar"
	>,
}

/** `API-G-09` — limites de `groupCount` e `groupSize`. */
export const groupsG09 = {
	...groupDefaults,
	casePrefix: "[G-09]",
	personPrefix: "[G-09]",
	memberCount: 4,
	errorMessage: "A configuração de divisão é inválida.",
	invalidSplits: [
		{ groupCount: 1, groupSize: 10 },
		{ groupCount: 51, groupSize: 10 },
		{ groupCount: 2, groupSize: 0 },
		{ groupCount: 2, groupSize: 101 },
	],
	validSplit: { groupCount: 2, groupSize: 50 },
}

/**
 * `API-G-10` — grupo sem integrante não muda de estado.
 *
 * O estado descrito pela estratégia (grupo em rascunho **sem nenhum
 * integrante**) é inalcançável: a criação exige ao menos uma pessoa e o `PATCH`
 * recusa `personIds: []` com "Selecione ao menos uma pessoa para o grupo.".
 * O caso passou a provar a invariante que torna o estado impossível — que é a
 * garantia real por trás da regra.
 */
export const groupsG10 = {
	...groupDefaults,
	casePrefix: "[G-10]",
	personPrefix: "[G-10]",
	emptyGroupMessage: "Selecione ao menos uma pessoa para o grupo.",
}

/**
 * `API-G-11` — a ativação tem regras próprias.
 *
 * A mensagem "Adicione participantes antes de ativar o grupo." é inalcançável
 * pela API: nenhum grupo chega a ficar sem integrantes (ver `G-10`). O caso
 * cobre a metade que existe — ativar um grupo que já está ativo.
 */
export const groupsG11 = {
	...groupDefaults,
	casePrefix: "[G-11]",
	personPrefix: "[G-11]",
	alreadyActiveMessage: "Somente grupos em rascunho podem ser ativados.",
	activeStatus: "active",
}

/** `API-G-12` — integrantes de grupo de formulário são imutáveis. */
export const groupsG12 = {
	...groupDefaults,
	casePrefix: "[G-12]",
	caseId: "G-12",
	answer: "Resposta do respondente",
	newName: "[G-12] Nome editado",
}

/** `API-G-13` — a edição substitui a composição inteira. */
export const groupsG13 = {
	...groupDefaults,
	casePrefix: "[G-13]",
	personPrefix: "[G-13]",
	initialMemberCount: 5,
	finalMemberCount: 3,
}

/**
 * `API-G-14` — transição livre de status.
 *
 * Não existe máquina de estados no `PATCH`: `finalized` volta para `draft` sem
 * qualquer verificação. O caso registra o comportamento real e fica vermelho se
 * ele mudar. Risco escalado em
 * https://github.com/pricaimiTech/dev.CrossHub/issues/103.
 */
export const groupsG14 = {
	...groupDefaults,
	casePrefix: "[G-14]",
	personPrefix: "[G-14]",
	finalizedStatus: "finalized" as const,
	draftStatus: "draft" as const,
	/** A mesma máquina de estados da ativação, agora também no PATCH (API-G-14). */
	errorMessage: "Um grupo finalizado não pode voltar a rascunho nem a ativo.",
}

/** `API-G-XT` — isolamento entre tenants. */
export const groupsGXT = {
	...groupDefaults,
	casePrefix: "[G-XT]",
	personPrefix: "[G-XT]",
	editedName: "[G-XT] Edição cruzada",
}

/**
 * `API-G-08b` — formação de grupos **pelo conteúdo da resposta**.
 *
 * É o caso de uso central do recurso para eventos: a pessoa responde e a
 * composição dos times sai do que ela respondeu.
 *
 * As respostas são **intercaladas** de propósito. Com respostas em ordem
 * (`1,1,1,5,5,5`), a divisão sequencial produz grupos que parecem separados por
 * perfil — e o teste passaria sem provar nada. Intercalando, só passa quem
 * realmente olha a resposta.
 */
export const groupsG08b = {
	...groupDefaults,
	casePrefix: "[G-08b]",
	caseId: "G-08b",
	formType: "TEAM_FORMATION" as const,
	/** Seis respostas alternando entre os extremos da escala. */
	scaleValues: [1, 5, 1, 5, 1, 5] as Array<number>,
	groupCount: 2,
	groupSize: 3,
	strategy: "similar" as const,
}
