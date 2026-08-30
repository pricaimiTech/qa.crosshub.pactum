/** Resposta de qualquer rota de login da plataforma. */
export interface IAccessTokenResponse {
	accessToken: string
	expiresIn?: number
}

/** Corpo do login do super admin (`POST /auth/platform/login`). */
export interface IPlatformLogin {
	email: string
	password: string
}

/** Corpo do login do administrador de tenant (`POST /auth/platform/tenant/login`). */
export interface ITenantLogin {
	slug: string
	email: string
	password: string
}
