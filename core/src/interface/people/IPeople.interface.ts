/**
 * Contratos do domínio `people` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IAccessCode {
	id: string
	tenantId: string
	personId: string
	/** Exibido uma única vez, no momento da geração. */
	code: string
	status: "active" | "revoked" | "used"
	expiresAt: string | null
	revokedAt: string | null
	createdAt: string
}

export interface ICreatePerson {
	name: string
	phone?: string | null
	birthDate?: string | null
	/** CPF ou outro documento de identificação. */
	document?: string | null
	gender?: "Feminino" | "Masculino" | "Outro" | "Prefiro não informar" | null
	/** Chave devolvida pelo upload de foto. */
	photoKey?: string | null
	notes?: string | null
	/** `pending` não é atribuível: é o estado inicial de quem ainda não ativou o acesso. */
	status?: "active" | "revoked"
	/** Obrigatório na criação — é por ele que a pessoa faz login no app. */
	email: string
}

export interface IPerson {
	id: string
	name: string
	email: string | null
	phone: string | null
	birthDate: string | null
	document: string | null
	gender: "Feminino" | "Masculino" | "Outro" | "Prefiro não informar" | null
	photoKey: string | null
	/** URL pública derivada de `photoKey`. */
	photoUrl: string | null
	notes: string
	status: "pending" | "active" | "revoked"
	createdAt: string
	updatedAt: string
}

export interface IPersonFormAssignment {
	id: string
	formId: string
	formTitle: string
	formType: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	status: "PENDING" | "AVAILABLE" | "OPENED" | "COMPLETED" | "EXPIRED" | "CANCELLED"
	/** Origem do envio (nome do grupo ou rótulo manual). */
	sourceLabel: string
	availableAt: string
	expiresAt: string | null
	submittedAt: string | null
}

export interface IPersonListItem {
	id: string
	name: string
	email: string | null
	phone: string | null
	birthDate: string | null
	document: string | null
	gender: "Feminino" | "Masculino" | "Outro" | "Prefiro não informar" | null
	photoKey: string | null
	/** URL pública derivada de `photoKey`. */
	photoUrl: string | null
	notes: string
	status: "pending" | "active" | "revoked"
	createdAt: string
	updatedAt: string
	/** Status do código de acesso mais recente; `null` quando nunca foi gerado. */
	accessCodeStatus: "active" | "revoked" | "used" | null
	/** Atalho para `accessCodeStatus === "active"`. */
	hasActiveCode: boolean
}

export interface IRemovedAccess {
	id: string
	name: string
}

export interface IUpdatePerson {
	name: string
	phone?: string | null
	birthDate?: string | null
	/** CPF ou outro documento de identificação. */
	document?: string | null
	gender?: "Feminino" | "Masculino" | "Outro" | "Prefiro não informar" | null
	/** Chave devolvida pelo upload de foto. */
	photoKey?: string | null
	notes?: string | null
	/** `pending` não é atribuível: é o estado inicial de quem ainda não ativou o acesso. */
	status?: "active" | "revoked"
	email?: string | null
}
