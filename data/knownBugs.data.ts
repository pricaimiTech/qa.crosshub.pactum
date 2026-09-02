import type { IKnownBug } from "@core/interfaces/global.interface"

/**
 * Bugs abertos pela automação, indexados pelo ID do caso da estratégia.
 *
 * Um caso aqui dentro **continua vermelho de propósito**: o teste segue fiel à
 * especificação e só fica verde quando a API for corrigida. O `bugTag()` leva o
 * número para o título do `it` e o `bugMessage()` leva a URL para a falha.
 *
 * Abrir um bug novo: `node scripts/abrir-bug.mjs --caso <ID> --titulo "..." --arquivo corpo.md`
 * — o script devolve o trecho pronto para colar aqui.
 *
 * Board: https://github.com/users/pricaimiTech/projects/7/views/4
 */
export const knownBugs: Record<string, IKnownBug> = {
	"API-AG-05": {
		number: 85,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/85",
		summary: "Disponibilidade aceita regras sobrepostas no mesmo dia da semana",
	},
	"API-AG-07": {
		number: 88,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/88",
		summary: "Mensagem da cota diária de agendamentos diverge da especificação",
	},
	"API-AG-12": {
		number: 91,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/91",
		summary:
			"professionalSelectionMode: validação responde 409 em vez de 400 e a disponibilidade não exige o profissional",
	},
	"API-AG-13": {
		number: 91,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/91",
		summary:
			"professionalSelectionMode: validação responde 409 em vez de 400 e a disponibilidade não exige o profissional",
	},
	"API-AG-21": {
		number: 90,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/90",
		summary:
			"Reagendamento não persiste o vínculo entre o agendamento original e o substituto",
	},
	"API-AG-28": {
		number: 93,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/93",
		summary:
			"Calendário não traz feriados móveis (Carnaval, Sexta-feira Santa, Corpus Christi)",
	},
	"API-AG-30": {
		number: 92,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/92",
		summary: "Analytics sem o add-on devolve 500 em vez de 400 com a mensagem do gate",
	},
	"API-G-08b": {
		number: 106,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/106",
		summary:
			"Formação de grupos por formulário ignora as respostas: similar, balanced e random dão a mesma divisão",
	},
	"API-H-04": {
		number: 109,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/109",
		summary: "Home devolve as ações fora da ordem de prioridade (high depois de medium)",
	},
	"API-BN-08": {
		number: 105,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/105",
		summary:
			"Configuração do carrossel responde 200 mas não grava nada em tenant sem marca salva",
	},
	/*
	 * O MESMO bug #105, indexado também pelo caso que ele derruba de lado.
	 *
	 * O `MK-08` grava o carrossel e depois salva a marca, esperando que o
	 * carrossel sobreviva. Em tenant sem linha de marca, o `saveSettings` faz
	 * `UPDATE ... WHERE tenant_id` que não acha nada, responde 200 devolvendo o
	 * que recebeu, e não grava — então o `putSaveBranding` seguinte INSERE a
	 * linha com o padrão 5. O caso não testa upsert de carrossel; ele tropeça no
	 * defeito de outro.
	 *
	 * **Só aparece em banco limpo.** Localmente o tenant já tem linha de marca
	 * de execuções anteriores e o teste passa. Foi a primeira execução no CI que
	 * mostrou, e é o tipo de dependência de ordem que só um banco novo revela.
	 */
	"API-MK-08": {
		number: 105,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/105",
		summary:
			"Salvar a marca zera o carrossel quando o tenant ainda não tinha linha de marca",
	},
	"API-CAT-01": {
		number: 89,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/89",
		summary:
			"Nome de categoria duplicado devolve 500 em vez de 409 (mesmo padrão do pacote)",
	},
	"API-C-02": {
		number: 100,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/100",
		summary: "Telefone vazio é gravado como string vazia em vez de null",
	},
	"API-C-16": {
		number: 101,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/101",
		summary:
			"GET /dashboard/people não tem paginação: 1024 clientes devolvem 345 KB em uma resposta",
	},
	"API-C-04": {
		number: 99,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/99",
		summary:
			"Código de acesso sem canal responde 400, mas o contrato declara 409",
	},
	"API-F-03": {
		number: 95,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/95",
		summary:
			"Republicar formulário encerrado responde 409 onde a especificação define 400",
	},
	"API-F-18": {
		number: 95,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/95",
		summary:
			"Acesso direto a formulário não atribuído devolve 404 onde a especificação define 403",
	},
	"API-F-23": {
		number: 97,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/97",
		summary:
			"Distribuição da escala soma 99% em vez de 100% (arredondamento sem compensação)",
	},
	"API-F-15": {
		number: 94,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/94",
		summary:
			"Segunda resposta em formulário ONCE_PER_PERSON devolve 500 em vez de 409",
	},
	"API-AG-32": {
		number: 87,
		url: "https://github.com/pricaimiTech/dev.CrossHub/issues/87",
		summary: "Notas internas do admin vazam para o app do cliente",
	},
}
