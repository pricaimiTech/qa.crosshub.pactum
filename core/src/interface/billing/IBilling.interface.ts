/**
 * Contratos do domínio `billing` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IBillingSummary {
	/** Receita recorrente mensal, em centavos. */
	monthlyRevenueCents: number
	currency: string
	activeClients: number
	inactiveClients: number
	/** Organizações sem plano ou com plano sem preço, fora do cálculo. */
	ignoredClients: number
}
