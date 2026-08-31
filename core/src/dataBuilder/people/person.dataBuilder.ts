import { faker } from "@faker-js/faker"
import type { ICreatePerson } from "../../interface/people/IPeople.interface"

/** Payload de `POST /dashboard/people`. */
export default class PersonDataBuilder {
	private personData: ICreatePerson

	constructor() {
		this.personData = PersonDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICreatePerson {
		return {
			name: `[QA] ${faker.person.fullName()}`,
			email: `qa-${faker.string.alphanumeric(10).toLowerCase()}@example.com`,
		}
	}

	/**
	 * Define o nome da pessoa, sufixado para não colidir entre execuções
	 * @param name - Prefixo do nome, normalmente o ID do caso de teste
	 */
	withName(name: string): PersonDataBuilder {
		this.personData.name = `${name} ${faker.person.fullName()}`
		return this
	}

	/**
	 * Define um e-mail único — é a credencial do login do cliente final
	 * @param prefix - Prefixo do e-mail, normalmente o ID do caso de teste
	 */
	withEmail(prefix: string): PersonDataBuilder {
		this.personData.email = `${prefix.toLowerCase().replace(/[^a-z0-9]/g, "")}-${faker.string.alphanumeric(10).toLowerCase()}@example.com`
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
	build(): ICreatePerson {
		const payload = structuredClone(this.personData)
		this.personData = PersonDataBuilder.defaults()

		return payload
	}
}
