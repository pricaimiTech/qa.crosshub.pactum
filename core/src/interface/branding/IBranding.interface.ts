/**
 * Contratos do domínio `branding` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IBrandTheme {
	seed: string
	mode: "dark" | "light"
	/** Rampa neutra, do degrau 1 ao último. */
	neutral: Array<string>
	/** Rampa de destaque, do degrau 1 ao último. */
	accent: Array<string>
	/** Tokens CSS nomeados (ex.: `--app-ink-muted`) apontando para os degraus das rampas. */
	tokens: Record<string, string>
}

export interface IBranding {
	tenantId: string
	displayName: string
	slogan: string
	description: string
	accentColor: string
	themeMode: "dark" | "light"
	logoKey: string | null
	coverKey: string | null
	logoUrl: string | null
	coverUrl: string | null
	carouselInterval: 3 | 5 | 7 | 10
	carouselHeight: "small" | "medium" | "large"
	carouselShowIndicators: boolean
	/** Calculado no servidor; o cliente nunca precisa recalcular a rampa. */
	theme: IBrandTheme
	createdAt: string
	updatedAt: string
}

export interface IPresignUpload {
	kind: "logo" | "cover"
	/** Aceita image/jpeg, image/png e image/webp. */
	contentType: string
	/** Tamanho do arquivo em bytes; o limite é 5 MB. */
	size: number
}

export interface IPresignedUpload {
	/** Chave a persistir no recurso (ex.: `imageKey`, `photoKey`). */
	key: string
	/** URL pública servida por `/assets/**`. */
	publicUrl: string | null
	/** URL assinada para o PUT do arquivo. */
	uploadUrl: string
	/** Validade da URL assinada, em segundos. */
	expiresIn: number
}

export interface ISaveBranding {
	displayName: string
	/** Aceita string vazia, mas o campo precisa estar presente. */
	slogan: string
	/** Aceita string vazia, mas o campo precisa estar presente. */
	description: string
	/** Semente da rampa OKLCH. Fundo e texto são derivados dela com contraste
mínimo garantido por construção, então qualquer hexadecimal válido é
aceito — ver ADR-004. */
	accentColor: string
	themeMode: "dark" | "light"
	/** Chave devolvida pelo upload de logo. */
	logoKey?: string | null
	/** Chave devolvida pelo upload de capa. */
	coverKey?: string | null
}
