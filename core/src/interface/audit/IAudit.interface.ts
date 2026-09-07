/**
 * Contratos do domínio `audit` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IAuditLog {
	id: string
	actorUserId: string | null
	action: string
	entityType: string
	entityId: string | null
	/** Identifica o evento; nunca carrega conteúdo fornecido por uma pessoa. */
	metadata: Record<string, Record<string, unknown>>
	createdAt: string
}

export interface IAuditLogPage {
	items: Array<IAuditLog>
	total: number
	page: number
	pageSize: number
	totalPages: number
}

/** Query string de `GET /dashboard/audit-logs`. */
export interface IGetListQuery {
	/** Página, começando em 1. */
	page?: number
	/** Itens por página. */
	pageSize?: number
	/** Ação exata registrada. */
	action?: string
	/** Usuário que executou a ação. */
	actorId?: string
	/** Tipo da entidade alvo. */
	entityType?: string
	/** Identificador da entidade alvo. */
	entityId?: string
	/** Início do período (inclusivo). */
	from?: string
	/** Fim do período (inclusivo). */
	to?: string
}
