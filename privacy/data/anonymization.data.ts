import { preSetup } from "@core/constants"

/** Login responde 201, não 200 — divergência aberta na issue #86. */
const loginParams = preSetup.preSetupParamsDefault(201, 5, 500)

const anonymizationDefaults = {
	pin: "1234",
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault404: (token?: string) =>
		preSetup.preSetupParamsDefault(404, 5, 500, token),
}

/**
 * `API-AN-01` e `API-AN-02` — rotas de anonimização e de exclusão física
 * **não existem**, e o caso guarda essa decisão de produto contra reintrodução
 * acidental.
 *
 * Anonimizar e apagar são irreversíveis: se um dia entrarem, devem entrar por
 * decisão explícita, com trilha e confirmação — não por alguém expor um
 * `DELETE` de rotina.
 */
export const anonymizationAN01 = {
	...anonymizationDefaults,
	casePrefix: "[AN-01]",
	/** Caminhos candidatos, todos ausentes do contrato. */
	absentRoutes: [
		{ method: "POST", path: "/dashboard/privacy/people/{personId}/anonymization-requests" },
		{ method: "POST", path: "/dashboard/people/{personId}/anonymize" },
		{ method: "DELETE", path: "/dashboard/people/{personId}" },
	],
}

/**
 * `API-AN-03` — "remover acesso" não é anonimizar.
 *
 * A pessoa perde a conta, mas o cadastro e todo o histórico continuam. É a
 * diferença entre revogar acesso e apagar alguém — e confundir as duas é como
 * se perde dado sem querer.
 */
export const anonymizationAN03 = {
	...anonymizationDefaults,
	casePrefix: "[AN-03]",
	/**
	 * Pessoa criada e ativada **no próprio caso**, não vinda do pool: o teste
	 * revoga o acesso dela, e um cliente do pool ficaria inutilizado para as
	 * execuções seguintes.
	 */
	answer: "Resposta preservada após a revogação",
	expectedStatus: "revoked",
	preservedFields: ["name", "email"] as Array<string>,
}

/**
 * `API-AN-04` — **bloqueado**.
 *
 * Verificar que não existe evento de anonimização em `audit_logs` exige ler a
 * trilha, e a API não expõe rota de leitura. Ver
 * https://github.com/pricaimiTech/dev.CrossHub/issues/96.
 */
