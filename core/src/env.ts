import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { config as loadDotenv } from "dotenv"

/** Ambientes suportados pela suíte. */
export const validTestEnvs = ["localhost", "develop", "prod"] as const
export type TestEnv = (typeof validTestEnvs)[number]

/**
 * Ambiente ativo da suíte, definido por `TEST_ENV` (default: `localhost`).
 * Cada ambiente tem seu próprio arquivo `.env.<ambiente>` na raiz do projeto
 * (não versionado — copiar de `.env.<ambiente>.example`).
 */
export const testEnv = (process.env.TEST_ENV || "localhost") as TestEnv

if (!validTestEnvs.includes(testEnv)) {
	throw new Error(
		`TEST_ENV inválido: "${testEnv}". Use um de: ${validTestEnvs.join(", ")}.`,
	)
}

const envFile = resolve(process.cwd(), `.env.${testEnv}`)

if (!existsSync(envFile)) {
	throw new Error(
		`Arquivo "${envFile}" não encontrado. ` +
			`Copie ".env.${testEnv}.example" para ".env.${testEnv}" e preencha os valores.`,
	)
}

loadDotenv({ path: envFile })
