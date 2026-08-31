/**
 * Contratos do domínio `groups` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface ICreateGroups {
	name: string
	description?: string
	/** De onde vêm os participantes: das respostas de um formulário ou de uma seleção manual. */
	origin: "form" | "people"
	/** Obrigatório quando `origin` é `form`. */
	formId?: string
	/** Obrigatório quando `origin` é `people`. */
	personIds?: Array<string>
	/** `manual` cria um único grupo; `split` divide os participantes em vários. */
	creationMode?: "manual" | "split"
	/** Quantos grupos gerar. Obrigatório e limitado a 2..50 quando `creationMode` é `split`. */
	groupCount?: number
	/** Participantes por grupo. Obrigatório e limitado a 1..100 quando `creationMode` é `split`. */
	groupSize?: number
	/** Como distribuir os participantes entre os grupos na divisão. */
	strategy?: "random" | "balanced" | "similar"
	/** Nome do ícone exibido no card do grupo. */
	icon?: string
}

export interface IGroup {
	id: string
	name: string
	description: string
	/** UUID do formulário de origem, ou `manual-<id do grupo>` em grupos manuais. */
	formId: string
	/** Título do formulário de origem ou o rótulo da seleção manual. */
	formTitle: string
	status: "draft" | "active" | "finalized"
	/** Descrição legível da estratégia usada na formação. */
	strategyLabel: string
	participantCount: number
	participantNames: Array<string>
	participantIds: Array<string>
	createdAt: string
	updatedAt: string
	/** Quem criou o grupo. */
	createdBy: string
	accentColor: string
	icon: string
}

export interface IUpdateGroup {
	name: string
	description?: string
	status: "draft" | "active" | "finalized"
	icon?: string
	/** Quando enviado, substitui integralmente a lista de participantes. */
	personIds?: Array<string>
}
