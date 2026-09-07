/**
 * Contratos do domínio `fixtures` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IBackdate {
	entity: "person" | "reservation" | "form_submission" | "appointment"
	id: string
	/** Novo instante de criação (ou de envio, para respostas de formulário). */
	at: string
}

export interface IBackdateResult {
	entity: "person" | "reservation" | "form_submission" | "appointment"
	id: string
	at: string
}
