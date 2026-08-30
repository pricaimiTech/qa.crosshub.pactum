import "./env"
import { assert } from "chai"
import { spec } from "pactum"
import type Spec from "pactum/src/models/Spec"
import type { IParamsDefault } from "./interface/global.interface"

/**
 * Spec base do Pactum, com log condicionado à env `LOG`.
 * Todo service deve partir daqui em vez de chamar `spec()` direto.
 */
export function specPactumJs(): Spec {
	const pactumSpec = spec()

	if (process.env.LOG === "true") {
		pactumSpec.inspect()
	}

	return pactumSpec
}

/** Asserções usadas nos testes — sempre com mensagem descritiva em português. */
export const assertTs: typeof assert = assert

/** Nome do `describe` por área da aplicação. */
export const describeName = {
	admin: "Admin",
	dashboard: "Dashboard",
	public: "Público",
} as const

/** Estado compartilhado entre `preSetup` e testes (tokens, ids). */
export const storage: Record<string, unknown> = {}

/** Fábricas de `IParamsDefault` reutilizadas pelos arquivos `.data.ts`. */
export const preSetup = {
	/**
	 * `IParamsDefault` para cenários de sucesso (200).
	 * @param retryCount - Número de novas tentativas
	 * @param retryDelay - Intervalo entre tentativas, em ms
	 * @param token - Bearer token, quando a rota for autenticada
	 */
	preSetupParamsDefault200(
		retryCount: number,
		retryDelay: number,
		token?: string,
	): IParamsDefault {
		return preSetup.preSetupParamsDefault(200, retryCount, retryDelay, token)
	},

	/**
	 * `IParamsDefault` para qualquer status esperado (inclusive 4xx).
	 * @param statusCode - Status HTTP esperado
	 * @param retryCount - Número de novas tentativas
	 * @param retryDelay - Intervalo entre tentativas, em ms
	 * @param token - Bearer token, quando a rota for autenticada
	 * @param tenantSlug - Slug do tenant, quando a rota exigir
	 */
	preSetupParamsDefault(
		statusCode: number,
		retryCount: number,
		retryDelay: number,
		token?: string,
		tenantSlug?: string,
	): IParamsDefault {
		return {
			statusCode,
			retry: { count: retryCount, delay: retryDelay },
			token,
			tenantSlug,
		}
	},
}
