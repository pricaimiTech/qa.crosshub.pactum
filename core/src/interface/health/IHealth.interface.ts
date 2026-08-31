/**
 * Contratos do domínio `health` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IHealthResponse {
	status: string
	service: string
}
