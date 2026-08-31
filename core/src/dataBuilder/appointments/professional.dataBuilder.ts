import { faker } from "@faker-js/faker"
import type { ICreateProfessional } from "../../interface/appointments/IAppointments.interface"

/** Payload de `POST /dashboard/appointments/professionals`. */
export default class ProfessionalDataBuilder {
	private professionalData: ICreateProfessional

	constructor() {
		this.professionalData = ProfessionalDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICreateProfessional {
		return {
			name: `[QA] Profissional ${faker.person.lastName()}`,
			isActive: true,
		}
	}

	/**
	 * Define o nome do profissional, sufixado para não colidir entre execuções
	 * @param name - Prefixo do nome, normalmente o ID do caso de teste
	 */
	withName(name: string): ProfessionalDataBuilder {
		this.professionalData.name = `${name} ${faker.person.lastName()}`
		return this
	}

	/**
	 * Define se o profissional aparece para agendamento
	 * @param isActive - `false` preserva o histórico, mas some da agenda
	 */
	withIsActive(isActive: boolean): ProfessionalDataBuilder {
		this.professionalData.isActive = isActive
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**.
	 *
	 * O builder é instanciado uma vez em `@core/constants` e reaproveitado — e o
	 * Mocha em paralelo roda vários arquivos de teste no mesmo processo. Sem o
	 * reset, um `with...()` de um caso vaza para o caso seguinte do mesmo worker,
	 * e o teste falha por uma configuração que ele nunca pediu.
	 */
	build(): ICreateProfessional {
		const payload = structuredClone(this.professionalData)
		this.professionalData = ProfessionalDataBuilder.defaults()

		return payload
	}
}
