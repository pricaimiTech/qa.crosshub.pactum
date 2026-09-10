import { poolPassword } from "@core/env"

/**
 * Admins de tenant reservados a casos de permissão.
 *
 * Cada caso que **altera** `canViewSensitiveData` precisa do seu próprio admin:
 * a permissão é estado global do tenant, e dois casos mexendo no mesmo admin em
 * paralelo derrubariam um ao outro.
 *
 * O admin principal (`TENANT_EMAIL`) nunca entra aqui — o acesso dele é
 * irrevogável por definição (`LGPD-06`).
 */
export const adminAllocation: Record<string, string> = {
	"LGPD-03": "Concede acesso sem ser o Principal",
	"LGPD-03-alvo": "Alvo da concessão indevida",
	"LGPD-04": "Lê submissão sensível sem autorização",
	"LGPD-05": "Envia formulário sensível sem autorização",
	"LGPD-08": "Recebe autorização com o token já emitido",
	"LGPD-09": "Perde autorização com o token já emitido",
	"LGPD-12": "Dispara a retenção sem autorização de leitura",
	"LGPD-13": "Alvo da concessão e da revogação auditadas",
	"F-19": "Não lê respostas de formulário sensível",
	"F-20": "Não conta respostas sensíveis no agregado",
	"H-08": "Não vê dado sensível na Home",
	"MN-02": "Admin desativado durante a sessão",
	"MN-03": "Menu escondido não substitui a checagem da API",
	"ANL-05": "Não vê e-mail nem telefone na aba Clientes do Analytics",
}

/** Senha usada por todos os admins do pool; vem de `POOL_PASSWORD`. */
export const adminPassword = poolPassword

/**
 * E-mail determinístico do admin de um caso.
 * @param caseId - Chave em `adminAllocation` (ex.: `LGPD-04`)
 */
export function adminEmailFor(caseId: string): string {
	return `qa-admin-${caseId.toLowerCase()}@example.com`
}

/** Arquivo onde o `preSetup` grava o pool de admins; não versionado. */
export const adminsFile = "preSetup/.admins.json"
