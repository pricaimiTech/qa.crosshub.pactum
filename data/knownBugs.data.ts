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
	/*
	 * Vazio de propósito desde a correção em lote do board (Sprint 3): os 17
	 * casos que viviam aqui ficaram verdes por mérito. O formato continua o
	 * mesmo para o próximo bug — ver `scripts/abrir-bug.mjs`.
	 */
}
