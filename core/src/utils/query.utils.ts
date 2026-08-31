import type Spec from "pactum/src/models/Spec"

/**
 * Aplica a query string ao spec, ignorando filtros vazios.
 *
 * O Pactum lança `params are required` quando recebe um objeto vazio, e há
 * rotas em que todos os filtros são opcionais (o extrato de pacote, por
 * exemplo). A condicional mora aqui para que os services gerados sigam sem
 * ramificação.
 * @param spec - Spec já com verbo e URL definidos
 * @param query - Filtros da query string; chaves `undefined` são descartadas
 */
export function withQuery<TQuery extends object>(
	spec: Spec,
	query: TQuery,
): Spec {
	const filled = Object.fromEntries(
		Object.entries(query).filter(([, value]) => value !== undefined),
	)

	return Object.keys(filled).length ? spec.withQueryParams(filled) : spec
}
