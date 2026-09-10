import { poolPassword } from "@core/env"

/**
 * Segundo tenant, usado só pelos casos de isolamento multi-tenant.
 *
 * Criado uma vez pelo `preSetup` (idempotente: se o slug já existir, ele é
 * reaproveitado e a senha do admin de QA é redefinida). Os testes nunca criam
 * tenant — criar um por execução deixaria lixo permanente na base.
 */
export const secondTenant = {
	slug: "automacao-teste-de-api-b",
	name: "Automação Teste de API — Tenant B",
	adminName: "QA Isolamento",
	adminEmail: "qa-isolamento@example.com",
	/** Vem de `POOL_PASSWORD`; mínimo de 12 caracteres, exigido por `ResetTenantAdminPasswordDto`. */
	adminPassword: poolPassword,
	contactEmail: "qa-isolamento@example.com",
}

/** Arquivo onde o `preSetup` grava os dados do segundo tenant; não versionado. */
export const secondTenantFile = "preSetup/.tenants.json"

/**
 * Segundo admin do tenant B, usado pelo caso `LGPD-01`.
 *
 * O primeiro admin de um tenant nasce Principal; este existe para provar que o
 * **segundo** não nasce. Vive no tenant B porque o tenant A já tem vários
 * administradores, e a regra só se observa a partir de um tenant novo.
 */
export const secondTenantExtraAdmin = {
	name: "QA segundo admin",
	email: "qa-segundo-admin@example.com",
	password: poolPassword,
}

/**
 * Terceiro tenant, mantido **vazio de propósito**.
 *
 * O caso `H-10` prova que um tenant sem dado nenhum devolve métricas zeradas e
 * listas vazias — é o caso que pega mock esquecido. Nenhum outro teste pode
 * escrever aqui: o tenant B já acumula massa de isolamento.
 */
export const emptyTenant = {
	slug: "automacao-teste-de-api-vazio",
	name: "Automação Teste de API — Tenant vazio",
	adminName: "QA tenant vazio",
	adminEmail: "qa-tenant-vazio@example.com",
	adminPassword: poolPassword,
	contactEmail: "qa-tenant-vazio@example.com",
}

/** Arquivo onde o `preSetup` grava o tenant vazio; não versionado. */
export const emptyTenantFile = "preSetup/.emptyTenant.json"

/**
 * Tenants reservados a casos que escrevem **estado global do tenant**.
 *
 * A marca é uma linha única por tenant (`brand_settings`): dois casos salvando
 * marca no mesmo tenant em paralelo sobrescrevem um ao outro. O mesmo vale para
 * qualquer configuração de tenant que não tenha chave própria.
 *
 * Cada entrada vira um tenant com admin próprio, criado uma vez pelo `preSetup`.
 */
export const tenantAllocation: Record<string, string> = {
	"MK-01": "Upsert de marca em registro único",
	"MK-02": "Campos obrigatórios do upsert de marca",
	"MK-03": "Formato da cor de destaque",
	"MK-03b": "Tema derivado na resposta",
	"MK-04": "Substituição de logo remove o ativo anterior",
	"MK-05": "Remoção de ativo com null explícito",
	"MK-08": "Marca não zera o carrossel",
	"MK-09": "Publicação da marca no payload público",
	"BN-01": "Limite de três banners ativos",
	"BN-02": "Ativação com o limite cheio",
	"BN-06": "Reordenação exige payload completo",
	"BN-07": "Reordenação válida",
	"BN-08": "Configuração do carrossel em tenant sem marca salva",
	"BN-08b": "Carrossel em tenant que nunca salvou marca",
	"BN-09": "Substituição de imagem deixa órfão",
	"BN-10": "Só banner ativo chega ao app",
	"H-01": "Janela de 24 h nas reservas, com massa envelhecida",
	"H-02": "Janela de 7 dias nas pessoas, com massa envelhecida",
	"H-09": "Alerta de atraso, com massa envelhecida",
	"ANL-01": "Sessão com e sem o add-on Analytics",
	"ANL-02": "Pedido de interesse idempotente no Analytics",
	"ANL-03": "Rotas do Analytics sem o add-on",
	"ANL-03b": "Ocupação de 40% com 10 h de agenda e 4 h atendidas",
	"ANL-03c": "Bloqueio reduz o denominador da ocupação",
	"ANL-06": "Ativar o add-on atende o pedido de interesse",
	"CLI-01": "Os três estados da organização",
}

/** Senha usada por todos os admins dos tenants por caso; vem de `POOL_PASSWORD`. */
export const caseTenantPassword = poolPassword

/**
 * Slug determinístico do tenant de um caso.
 * @param caseId - Chave em `tenantAllocation` (ex.: `MK-01`)
 */
export function caseTenantSlug(caseId: string): string {
	return `automacao-caso-${caseId.toLowerCase()}`
}

/** Arquivo onde o `preSetup` grava os tenants por caso; não versionado. */
export const caseTenantsFile = "preSetup/.caseTenants.json"
