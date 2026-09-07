import { faker } from "@faker-js/faker"
import { preSetup } from "@core/constants"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const catalogDefaults = {
	note: "Observação da reserva",
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
	paramsDefault409: (token?: string) =>
		preSetup.preSetupParamsDefault(409, 5, 500, token),
}

/** `API-CAT-01` — nome de categoria é único dentro do tenant. */
export const catalogCAT01 = {
	...catalogDefaults,
	casePrefix: "[CAT-01]",
	/** O mesmo nome literal, enviado duas vezes. */
	sharedName: `[CAT-01] Categoria ${faker.string.alphanumeric(8)}`,
}

/** `API-CAT-02` — limites de nome, descrição e ícone da categoria. */
export const catalogCAT02 = {
	...catalogDefaults,
	casePrefix: "[CAT-02]",
	longName: "N".repeat(61),
	longDescription: "D".repeat(151),
	invalidIcons: ["Briefcase", "brief case", "i".repeat(41)] as Array<string>,
	messages: {
		name: "O nome deve ter no máximo 60 caracteres.",
		description: "A descrição deve ter no máximo 150 caracteres.",
		icon: "Ícone inválido.",
	},
	defaultIcon: "briefcase",
}

/** `API-CAT-03` — categoria inativa não recebe vínculo. */
export const catalogCAT03 = {
	...catalogDefaults,
	casePrefix: "[CAT-03]",
	errorMessage: "Selecione uma categoria ativa para vincular o produto.",
}

/** `API-CAT-04` — excluir categoria não apaga os produtos. */
export const catalogCAT04 = {
	...catalogDefaults,
	casePrefix: "[CAT-04]",
	productCount: 3,
}

/** `API-CAT-05` — categoria de outro tenant não é encontrada. */
export const catalogCAT05 = {
	...catalogDefaults,
	casePrefix: "[CAT-05]",
	errorMessage: "Categoria não encontrada.",
}

/** `API-CAT-06` — preço é inteiro em centavos. */
export const catalogCAT06 = {
	...catalogDefaults,
	casePrefix: "[CAT-06]",
	errorMessage: "Preço inválido.",
	invalidPrices: [-1, 10.5] as Array<number>,
	validPrice: 1000,
}

/** `API-CAT-07` — produto inativo some da vitrine e recusa reserva. */
export const catalogCAT07 = {
	...catalogDefaults,
	casePrefix: "[CAT-07]",
	caseId: "CAT-07",
	errorMessage: "Produto não encontrado.",
}

/** `API-CAT-08` — validações do upload de imagem do produto. */
export const catalogCAT08 = {
	...catalogDefaults,
	casePrefix: "[CAT-08]",
	errorMessage: "Envie JPEG, PNG ou WebP com até 5 MB.",
	oversizedBytes: 5 * 1024 * 1024 + 1,
	acceptedBytes: 64 * 1024,
	paramsDefault413: (token?: string) =>
		preSetup.preSetupParamsDefault(413, 5, 500, token),
}

/** `API-CAT-09` — excluir o produto limpa a imagem do armazenamento. */
export const catalogCAT09 = {
	...catalogDefaults,
	casePrefix: "[CAT-09]",
	imageBytes: 64 * 1024,
}

/**
 * `API-CAT-10` — exclusão de produto com reserva histórica.
 *
 * A especificação recomenda inativar em vez de excluir. O caso registra o
 * comportamento real e serve de alarme se ele mudar. Risco escalado em
 * https://github.com/pricaimiTech/dev.CrossHub/issues/104.
 */
export const catalogCAT10 = {
	...catalogDefaults,
	casePrefix: "[CAT-10]",
	caseId: "CAT-10",
	/** Mesmo padrão de profissionais com agendamento (API-CAT-10). */
	errorMessage:
		"Este produto possui reservas e não pode ser excluído. Inative-o para preservar o histórico.",
}

/** `API-CAT-11` — máquina de estados da reserva. */
export const catalogCAT11 = {
	...catalogDefaults,
	casePrefix: "[CAT-11]",
	caseId: "CAT-11",
	forwardFlow: ["in_progress", "confirmed", "completed"] as Array<
		"in_progress" | "confirmed" | "completed" | "cancelled"
	>,
	errorMessage: "Essa alteração de status não é permitida.",
	backwardStatus: "in_progress" as const,
}

/** `API-CAT-12` — cancelamento pelo admin exige motivo. */
export const catalogCAT12 = {
	...catalogDefaults,
	casePrefix: "[CAT-12]",
	caseId: "CAT-12",
	missingReasonMessage: "Informe o motivo do cancelamento.",
	longReasonMessage: "O motivo deve ter no máximo 1000 caracteres.",
	longReason: "M".repeat(1001),
	validReason: "Produto esgotado no estoque.",
	expectedCancelledBy: "admin",
}

/** `API-CAT-13` — o cliente só cancela a própria reserva, e só em `pending`. */
export const catalogCAT13 = {
	...catalogDefaults,
	casePrefix: "[CAT-13]",
	caseId: "CAT-13",
	errorMessage: "A reserva só pode ser cancelada enquanto estiver nova.",
	clientReason: "Mudei de ideia.",
	expectedCancelledBy: "client",
}

/** `API-CAT-14` — falha no envio de e-mail não desfaz a reserva. */
export const catalogCAT14 = {
	...catalogDefaults,
	casePrefix: "[CAT-14]",
	caseId: "CAT-14",
}

/** `API-CAT-XT` — isolamento entre tenants, inclusive na vitrine pública. */
export const catalogCATXT = {
	...catalogDefaults,
	casePrefix: "[CAT-XT]",
	editedName: "[CAT-XT] Edição cruzada",
}

/**
 * `API-CAT-15` — **bloqueado**.
 *
 * Depende de variar `EMAIL_FROM` e `RESEND_API_KEY` no processo da API e de
 * observar o envio. Não é alcançável por uma suíte que fala só HTTP com a API já
 * em execução.
 */
