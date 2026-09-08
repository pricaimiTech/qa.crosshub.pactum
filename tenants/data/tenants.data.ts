import { preSetup } from "@core/constants"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const tenantsDefaults = {
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
	paramsDefault401: (token?: string) =>
		preSetup.preSetupParamsDefault(401, 5, 500, token),
	paramsDefault404: (token?: string) =>
		preSetup.preSetupParamsDefault(404, 5, 500, token),
}

/**
 * `API-CLI-01` — os três estados da organização.
 *
 * O caso troca o status do próprio tenant, que é estado global: por isso ele
 * usa um tenant reservado (`tenantFor`) e devolve o registro para `active` no
 * fim. Rodar contra um tenant compartilhado derrubaria todo caso vizinho que
 * precisa autenticar.
 */
export const tenantsCLI01 = {
	...tenantsDefaults,
	caseId: "CLI-01",
	casePrefix: "[CLI-01]",
	/** O assistente do Admin grava a implantação com este valor desde a issue 143. */
	onboarding: "onboarding" as const,
	active: "active" as const,
	suspended: "inactive" as const,
	/** Nome que só o front do assistente usa; o contrato nunca o aceitou. */
	invalidStatus: "setup",
	invalidStatusMessage: "Status inválido.",
	unauthorizedMessage: "Credenciais inválidas.",
	notFoundMessage: "Organização não encontrada ou inativa.",
}
