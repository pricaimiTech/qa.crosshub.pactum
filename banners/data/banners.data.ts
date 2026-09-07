import { preSetup } from "@core/constants"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const bannerDefaults = {
	/** Imagem gerada em tempo de execução; nenhum arquivo é versionado. */
	imageBytes: 64 * 1024,
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

/** `API-BN-01` — no máximo três banners ativos por tenant. */
export const bannersBN01 = {
	...bannerDefaults,
	casePrefix: "[BN-01]",
	caseId: "BN-01",
	activeLimit: 3,
	errorMessage: "Máximo de 3 banners ativos.",
}

/** `API-BN-02` — ativar um quarto banner com o limite cheio. */
export const bannersBN02 = {
	...bannerDefaults,
	casePrefix: "[BN-02]",
	caseId: "BN-02",
	activeLimit: 3,
	errorMessage: "Máximo de 3 banners ativos.",
}

/** `API-BN-03` — título e imagem são obrigatórios. */
export const bannersBN03 = {
	...bannerDefaults,
	casePrefix: "[BN-03]",
	errorMessage: "Título e imagem são obrigatórios.",
}

/** `API-BN-04` — formato do link de ação. */
export const bannersBN04 = {
	...bannerDefaults,
	casePrefix: "[BN-04]",
	errorMessage: "Link inválido.",
	invalidLinks: ["ftp://x", "www.exemplo.com", "/interno"] as Array<string>,
	validLink: "https://exemplo.com",
}

/** `API-BN-05` — limites de texto do botão e do título. */
export const bannersBN05 = {
	...bannerDefaults,
	casePrefix: "[BN-05]",
	longLabel: "L".repeat(21),
	labelMessage: "Texto do botão inválido.",
	titleMessage: "Título e imagem são obrigatórios.",
	validLink: "https://exemplo.com",
}

/** `API-BN-06` — a reordenação exige a lista completa e exata. */
export const bannersBN06 = {
	...bannerDefaults,
	casePrefix: "[BN-06]",
	caseId: "BN-06",
	bannerCount: 4,
	errorMessage: "A lista de banners não confere.",
	unknownId: "00000000-0000-0000-0000-000000000000",
}

/** `API-BN-07` — reordenação válida reflete em `position`. */
export const bannersBN07 = {
	...bannerDefaults,
	casePrefix: "[BN-07]",
	caseId: "BN-07",
	bannerCount: 3,
}

/** `API-BN-08` — limites da configuração do carrossel. */
export const bannersBN08 = {
	...bannerDefaults,
	casePrefix: "[BN-08]",
	/**
	 * Tenant que **nunca salvou marca**: é a única forma de exercitar o caminho do
	 * bug #105, já que a linha de `brand_settings` uma vez criada não volta a
	 * não existir.
	 */
	caseId: "BN-08b",
	errorMessage: "Configurações do carrossel inválidas.",
	invalidSettings: [
		{ interval: 4, height: "large", showIndicators: true },
		{ interval: 7, height: "huge", showIndicators: true },
	],
	validSettings: {
		interval: 7 as const,
		height: "large" as const,
		showIndicators: true,
	},
}

/**
 * `API-BN-09` — substituir a imagem do banner deixa a anterior órfã.
 *
 * A estratégia registra a divergência com Marca (`MK-04`), onde o ativo anterior
 * é removido. O caso documenta o comportamento atual dos dois lados.
 */
export const bannersBN09 = {
	...bannerDefaults,
	casePrefix: "[BN-09]",
	caseId: "BN-09",
}

/** `API-BN-10` — só banner ativo chega ao app, na ordem definida. */
export const bannersBN10 = {
	...bannerDefaults,
	casePrefix: "[BN-10]",
	caseId: "BN-10",
	activeCount: 2,
}

/** `API-BN-XT` — isolamento entre tenants. */
export const bannersBNXT = {
	...bannerDefaults,
	casePrefix: "[BN-XT]",
	editedTitle: "[BN-XT] Edição cruzada",
}
