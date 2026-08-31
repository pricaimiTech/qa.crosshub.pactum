import type {
	IAvailabilityRule,
	ISaveAvailability,
} from "../../interface/appointments/IAppointments.interface"

/** Payload de `PUT /dashboard/appointments/professionals/{id}/availability`. */
export default class AvailabilityDataBuilder {
	private availabilityData: ISaveAvailability

	constructor() {
		this.availabilityData = { rules: [] as Array<IAvailabilityRule> }
	}

	/** Zera as regras acumuladas, para reaproveitar o builder no mesmo processo */
	reset(): AvailabilityDataBuilder {
		this.availabilityData = { rules: [] as Array<IAvailabilityRule> }
		return this
	}

	/**
	 * Acrescenta uma regra de disponibilidade
	 * @param weekday - Dia da semana, de 0 (domingo) a 6 (sábado)
	 * @param startTime - Início do turno, `HH:mm` no fuso do tenant
	 * @param endTime - Fim do turno, `HH:mm` no fuso do tenant
	 * @param shift - Turno da regra; default `morning`
	 */
	withRule(
		weekday: number,
		startTime: string,
		endTime: string,
		shift: "morning" | "afternoon" | "night" = "morning",
	): AvailabilityDataBuilder {
		this.availabilityData.rules.push({ weekday, shift, startTime, endTime })
		return this
	}

	/**
	 * Acrescenta a mesma faixa em vários dias da semana de uma vez.
	 *
	 * Casos que repetem a mesma disputa em datas diferentes precisam de agenda
	 * em qualquer dia que a faixa alcance.
	 * @param weekdays - Dias da semana, de 0 (domingo) a 6 (sábado)
	 * @param startTime - Início do turno, `HH:mm` no fuso do tenant
	 * @param endTime - Fim do turno, `HH:mm` no fuso do tenant
	 * @param shift - Turno das regras; default `morning`
	 */
	withRuleOnWeekdays(
		weekdays: Array<number>,
		startTime: string,
		endTime: string,
		shift: "morning" | "afternoon" | "night" = "morning",
	): AvailabilityDataBuilder {
		weekdays.forEach((weekday) =>
			this.withRule(weekday, startTime, endTime, shift),
		)
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**.
	 *
	 * O builder é instanciado uma vez em `@core/constants` e reaproveitado — e o
	 * Mocha em paralelo roda vários arquivos de teste no mesmo processo. Sem o
	 * reset, um `with...()` de um caso vaza para o caso seguinte do mesmo worker.
	 */
	build(): ISaveAvailability {
		const payload = structuredClone(this.availabilityData)
		this.reset()

		return payload
	}
}
