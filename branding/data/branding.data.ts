import { preSetup } from "@core/constants"
import { knownBugs } from "@shared-data/knownBugs.data"

/** Login responde 201, não 200 — divergência aberta na issue #86. */
const loginParams = preSetup.preSetupParamsDefault(201, 5, 500)

const brandingDefaults = {
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
	paramsDefault413: (token?: string) =>
		preSetup.preSetupParamsDefault(413, 5, 500, token),
}

/** `API-MK-01` — a marca é uma linha só, sobrescrita a cada PUT. */
export const brandingMK01 = {
	...brandingDefaults,
	casePrefix: "[MK-01]",
	caseId: "MK-01",
	firstColor: "#112233",
	secondColor: "#445566",
	secondTheme: "dark" as const,
}

/** `API-MK-02` — campos obrigatórios do upsert. */
export const brandingMK02 = {
	...brandingDefaults,
	casePrefix: "[MK-02]",
	caseId: "MK-02",
	nameMessage: "O nome é obrigatório.",
	themeMessage: 'O tema deve ser "dark" ou "light".',
	colorMessage: "Informe a cor de destaque em hexadecimal, no formato #RRGGBB.",
}

/** `API-MK-03` — formato da cor de destaque. */
export const brandingMK03 = {
	...brandingDefaults,
	casePrefix: "[MK-03]",
	caseId: "MK-03",
	errorMessage: "Informe a cor de destaque em hexadecimal, no formato #RRGGBB.",
	invalidColors: ["#FFF", "rgb(0,0,0)", "azul", "#GGGGGG"] as Array<string>,
	lowercaseColor: "#0b1f33",
	normalizedColor: "#0B1F33",
}

/** `API-MK-03b` — o tema derivado vem pronto na resposta. */
export const brandingMK03b = {
	...brandingDefaults,
	casePrefix: "[MK-03b]",
	caseId: "MK-03b",
	accentColor: "#2F49D1",
	themeMode: "light" as const,
}

/** `API-MK-05` — remover ativo exige `null` explícito. */
export const brandingMK05 = {
	...brandingDefaults,
	casePrefix: "[MK-05]",
	caseId: "MK-05",
	kind: "logo" as const,
	logoBytes: 64 * 1024,
}

/**
 * `API-MK-04` — substituir a logo sobrescreve a chave, não deixa órfão.
 *
 * A especificação diz que o objeto antigo some do armazenamento **exceto se a
 * chave terminar em `/current`**. A logo é justamente essa exceção: o
 * `r2-storage.service.ts` gera `.../branding/logo/current` — chave FIXA —
 * enquanto banner, produto e foto recebem `crypto.randomUUID()`.
 *
 * Ou seja: para a logo não existe objeto antigo a apagar. A substituição
 * sobrescreve no lugar, e a URL pública continua válida — que é o ponto de usar
 * um apelido estável, porque apagar quebraria o link enquanto o novo sobe.
 *
 * A primeira versão deste caso assertava 404 na URL antiga e falhou no CI com
 * 200. O teste estava errado, não a API: eu tinha lido a exceção na estratégia e
 * escrito a asserção contrária.
 */
export const brandingMK04 = {
	...brandingDefaults,
	casePrefix: "[MK-04]",
	caseId: "MK-04",
	kind: "logo" as const,
	/**
	 * Tamanhos diferentes nas duas, e é o que prova a substituição: a chave é a
	 * mesma, então só o CONTEÚDO distingue a logo nova da antiga.
	 */
	primeiraLogoBytes: 48 * 1024,
	segundaLogoBytes: 72 * 1024,
	/** Sufixo que a especificação isenta da remoção. */
	chavePreservada: "/current",
}

/** `API-MK-06` — chave de outro tenant é recusada. */
export const brandingMK06 = {
	...brandingDefaults,
	casePrefix: "[MK-06]",
	kind: "logo" as const,
	logoBytes: 64 * 1024,
}

/** `API-MK-07` — tipo e tamanho no upload de ativo. */
export const brandingMK07 = {
	...brandingDefaults,
	casePrefix: "[MK-07]",
	kind: "logo" as const,
	errorMessage: "Envie JPEG, PNG ou WebP com até 5 MB.",
	oversizedBytes: 5 * 1024 * 1024 + 1,
	acceptedBytes: 64 * 1024,
}

/** `API-MK-07b` — URL assinada para upload direto. */
export const brandingMK07b = {
	...brandingDefaults,
	casePrefix: "[MK-07b]",
	kind: "logo" as const,
	contentType: "image/webp",
	validSize: 64 * 1024,
	oversizedSize: 5 * 1024 * 1024 + 1,
	invalidKind: "banner",
	expectedExpiresIn: 300,
}

/** `API-MK-08` — salvar a marca não zera as configurações do carrossel. */
export const brandingMK08 = {
	...brandingDefaults,
	casePrefix: "[MK-08]",
	caseId: "MK-08",
	knownBug: knownBugs["API-MK-08"],
	carousel: {
		interval: 7 as const,
		height: "large" as const,
		showIndicators: false,
	},
}

/** `API-MK-09` — o payload público reflete a marca salva. */
export const brandingMK09 = {
	...brandingDefaults,
	casePrefix: "[MK-09]",
	caseId: "MK-09",
	accentColor: "#7A1FA2",
	themeMode: "dark" as const,
}

/** `API-MK-XT` — cada tenant lê e escreve a própria marca. */
export const brandingMKXT = {
	...brandingDefaults,
	casePrefix: "[MK-XT]",
	firstTenantColor: "#101010",
	secondTenantColor: "#EFEFEF",
}

/**
 * `API-MK-04` — **parcialmente verificável**.
 *
 * A substituição de ativo depende de inspecionar o armazenamento para provar que
 * o objeto anterior foi removido, e a exceção da chave terminada em `/current`
 * não é observável pela API. O que dá para verificar — que a URL nova substitui
 * a antiga — está coberto por `MK-05`.
 */
