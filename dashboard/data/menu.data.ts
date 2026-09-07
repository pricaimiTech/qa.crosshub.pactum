import { preSetup } from "@core/constants"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const menuDefaults = {
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault401: (token?: string) =>
		preSetup.preSetupParamsDefault(401, 5, 500, token),
	paramsDefault403: (token?: string) =>
		preSetup.preSetupParamsDefault(403, 5, 500, token),
}

/**
 * `API-MN-01` — a sessão não carrega as flags de permissão.
 *
 * Quem monta o menu a partir de `canViewSensitiveData` ou `isPrimaryAdmin`
 * precisa buscá-las em `GET /dashboard/privacy/professionals`; a sessão não as
 * devolve.
 */
export const menuMN01 = {
	...menuDefaults,
	expectedFields: ["email", "tenantId", "role"] as Array<string>,
	absentFields: ["canViewSensitiveData", "isPrimaryAdmin"] as Array<string>,
}

/**
 * `API-MN-02` — token inválido e admin desativado.
 *
 * A variação "token expirado" fica de fora: o TTL é de 15 minutos e assinar um
 * token vencido exigiria o `JWT_ACCESS_SECRET` da API, que a suíte não conhece
 * — e nem deveria. As outras duas variações cobrem o que importa, inclusive a
 * reconferência de `isActive` a cada requisição.
 */
export const menuMN02 = {
	...menuDefaults,
	caseId: "MN-02",
	tamperedToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWxzbyJ9.assinatura-invalida",
}

/** `API-MN-03` — esconder o item de menu nunca é a única defesa. */
export const menuMN03 = {
	...menuDefaults,
	caseId: "MN-03",
	casePrefix: "[MN-03]",
	answer: "Resposta sensível",
	errorMessage:
		"Você não possui a permissão para visualizar respostas sensíveis.",
}
