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

const senhaDosPools = process.env.POOL_PASSWORD

if (!senhaDosPools) {
	throw new Error(
		`POOL_PASSWORD não definida em "${envFile}". ` +
			"É a senha dos admins e tenants descartáveis que o `preSetup` cria; " +
			"o `preSetup` redefine a senha de todos eles a cada execução, então " +
			"basta escolher um valor e rodar `npm run pre-setup`.",
	)
}

if (senhaDosPools.length < 12) {
	throw new Error(
		"POOL_PASSWORD precisa de no mínimo 12 caracteres — é o que o " +
			"`ResetTenantAdminPasswordDto` da API exige.",
	)
}

/**
 * Senha de todas as contas descartáveis criadas pelo `preSetup` (pools de
 * admins, segundo tenant, tenant vazio e tenants por caso).
 *
 * Fica no ambiente, e não no código, porque o repositório é público: um valor
 * versionado aqui vale para sempre e para qualquer um, mesmo sendo de conta
 * descartável.
 */
export const poolPassword = senhaDosPools
