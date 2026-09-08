import { dateInDays, rangeOfDays } from "@core/utils/date.utils"

/**
 * Um dia exclusivo por caso de teste.
 *
 * Casos que compartilham data compartilham a listagem de agendamentos daquele
 * dia: a massa se acumula, a limpeza de um vira trabalho do outro e a consulta
 * do dia cresce sem limite. Com um dia por caso, cada teste enxerga só o que ele
 * mesmo criou — e a limpeza volta a ser barata e determinística.
 *
 * O número é o deslocamento em dias a partir de hoje. Sempre no futuro, para
 * escapar da regra que omite janelas já passadas.
 */
export const caseDayOffset: Record<string, number> = {
	"AG-07": 7,
	"AG-08": 8,
	"AG-09": 9,
	"AG-10": 10,
	"AG-11": 11,
	"AG-12": 12,
	"AG-13": 13,
	"AG-14": 14,
	"AG-15": 15,
	"AG-17": 17,
	"AG-18": 18,
	"AG-21": 30,
	"AG-22": 22,
	"AG-24": 24,
	"AG-25": 25,
	"AG-31": 31,
	"AG-31b": 32,
	"AG-32": 33,
	"AG-XT": 34,
	"AG-04": 0,
	"AG-06": 35,
	"AG-21b": 36,
	"AG-23": 37,
	"AG-23b": 38,
	"AG-26": 40,
	"AG-27": 41,
	"AG-29": 39,
	"AG-16": 43,
	"AG-20": 44,
	"AG-19": 45,
	"AG-05": 46,
	"AG-01": 47,
	"AG-02": 48,
	"AG-03": 49,
	"ANL-03b": 51,
	"ANL-03c": 52,
	"ANL-05": 53,
}

/**
 * Data reservada a um caso, no formato `YYYY-MM-DD`.
 * @param caseId - ID curto do caso, como em `caseDayOffset` (ex.: `AG-18`)
 */
export function dateForCase(caseId: string): string {
	const offset = caseDayOffset[caseId]

	if (offset === undefined) {
		throw new Error(
			`Sem data reservada para "${caseId}". Acrescente o caso em data/testDates.data.ts.`,
		)
	}

	return dateInDays(offset)
}

/**
 * Faixas de dias reservadas aos casos que repetem a mesma disputa em datas
 * diferentes.
 *
 * Ficam **acima** de qualquer `caseDayOffset` de propósito: uma faixa que
 * atravessasse os dias de outros casos os contaminaria, já que a limpeza zera o
 * dia inteiro.
 */
export const caseDayRange: Record<string, { firstOffset: number; days: number }> =
	{
		"AG-16": { firstOffset: 60, days: 20 },
		"AG-14": { firstOffset: 90, days: 5 },
	}

/**
 * Datas reservadas a um caso que precisa de vários dias.
 * @param caseId - ID curto do caso, como em `caseDayRange` (ex.: `AG-16`)
 */
export function datesForCase(caseId: string): Array<string> {
	const range = caseDayRange[caseId]

	if (!range) {
		throw new Error(
			`Sem faixa de datas reservada para "${caseId}". Acrescente o caso em data/testDates.data.ts.`,
		)
	}

	return rangeOfDays(range.firstOffset, range.days)
}
