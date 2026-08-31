/**
 * Quantos clientes finais cada caso precisa.
 *
 * `POST /auth/platform/public/activate` é limitado por rate limit (429 após
 * poucas chamadas seguidas), então **nenhum teste ativa cliente**. O `preSetup`
 * cria o pool inteiro uma vez, com espera entre as ativações, e os testes só
 * fazem login — que não tem limite.
 *
 * Cada caso recebe uma fatia exclusiva do pool: dois casos nunca dividem o mesmo
 * cliente, o que mantém a suíte segura rodando em paralelo.
 */
export const endUserAllocation: Record<string, number> = {
	"AG-07": 1,
	"AG-08": 1,
	"AG-10": 1,
	"AG-11": 1,
	"AG-15": 1,
	"AG-16": 2,
	"AG-17": 6,
	"AG-19": 2,
	"AG-22": 1,
	"AG-12": 1,
	"AG-13": 1,
	"AG-14": 1,
	"AG-18": 2,
	"AG-24": 1,
	"AG-25": 1,
	"AG-32": 1,
	"F-08": 1,
	"F-15": 1,
	"F-18": 1,
	"F-19": 1,
	"F-12": 1,
	"F-16": 1,
	"F-17": 1,
	"F-20": 1,
	"F-21": 1,
	"F-22": 1,
	"F-23": 3,
	"LGPD-04": 1,
	"LGPD-05": 1,
	"LGPD-08": 1,
	"LGPD-09": 1,
	"LGPD-11": 1,
	"H-07": 1,
	"H-08": 1,
	"MN-03": 1,
	"G-04": 1,
	"G-05": 1,
	"G-08b": 6,
	"G-12": 1,
	"CAT-07": 1,
	"CAT-10": 1,
	"CAT-11": 1,
	"CAT-12": 1,
	"CAT-13": 2,
	"CAT-14": 1,
}

/** Senha numérica de 4 dígitos usada em todo o pool. */
export const endUserPassword = "1234"

/** Arquivo onde o `preSetup` grava o pool; não versionado. */
export const endUsersFile = "preSetup/.endUsers.json"
