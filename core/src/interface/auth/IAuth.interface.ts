/**
 * Contratos do domínio `auth` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IAccessTokenResponse {
	accessToken: string
	tokenType: string
	/** Duração do token, em segundos. */
	expiresIn: number
}

export interface IPlatformLoginRequest {
	email: string
	password: string
}

export interface IPublicActivationRequest {
	slug: string
	/** Código de acesso entregue pela organização. */
	code: string
	password: string
	/** Consentimento obrigatório para ativação. */
	consent: boolean
	name?: string
}

export interface IPublicLoginRequest {
	/** Slug da organização. */
	slug: string
	email: string
	password: string
}

export interface IPublicProfileResponse {
	personName: string
	email: string
	phone: string | null
}

export interface IPublicSessionResponse {
	personId: string
	tenantId: string
	personName: string | null
	email: string | null
	phone: string | null
}

export interface ITenantLoginRequest {
	/** Slug da organização. */
	slug: string
	email: string
	password: string
}

export interface IUpdatePublicPasswordRequest {
	currentPassword: string
	newPassword: string
}

export interface IUpdatePublicProfileRequest {
	name: string
	email: string
	phone: string
	/** Obrigatória somente ao alterar o e-mail. */
	currentPassword?: string
}

export interface IUpdatedResponse {
	updated: boolean
}
