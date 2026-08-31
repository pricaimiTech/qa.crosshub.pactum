import { faker } from "@faker-js/faker"
import type { ICreateGroups } from "../../interface/groups/IGroups.interface"

/** Payload de `POST /dashboard/groups`. */
export default class GroupDataBuilder {
	private groupData: ICreateGroups

	constructor() {
		this.groupData = GroupDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICreateGroups {
		return {
			name: `[QA] Grupo ${faker.string.alphanumeric(8)}`,
			description: "",
			origin: "people",
			personIds: [],
			creationMode: "manual",
		}
	}

	/**
	 * Define o nome do grupo, sufixado para não colidir entre execuções
	 * @param name - Prefixo do nome, normalmente o ID do caso de teste
	 */
	withName(name: string): GroupDataBuilder {
		this.groupData.name = `${name} ${faker.string.alphanumeric(8)}`
		return this
	}

	/**
	 * Monta um grupo a partir de uma seleção manual de pessoas
	 * @param personIds - Integrantes, na ordem desejada
	 */
	withPeople(personIds: Array<string>): GroupDataBuilder {
		this.groupData.origin = "people"
		this.groupData.personIds = personIds
		return this
	}

	/**
	 * Monta um grupo a partir dos respondentes de um formulário encerrado
	 * @param formId - Formulário de origem
	 */
	withForm(formId: string): GroupDataBuilder {
		this.groupData.origin = "form"
		this.groupData.formId = formId
		this.groupData.personIds = undefined
		return this
	}

	/**
	 * Divide os participantes em vários grupos
	 * @param groupCount - Quantos grupos criar
	 * @param groupSize - Capacidade de cada grupo
	 */
	withSplit(groupCount: number, groupSize: number): GroupDataBuilder {
		this.groupData.creationMode = "split"
		this.groupData.groupCount = groupCount
		this.groupData.groupSize = groupSize
		return this
	}

	/**
	 * Define o rótulo da estratégia de divisão
	 * @param strategy - `random`, `balanced` ou `similar`
	 */
	withStrategy(strategy: "random" | "balanced" | "similar"): GroupDataBuilder {
		this.groupData.strategy = strategy
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**, porque o Mocha em
	 * paralelo roda vários arquivos de teste no mesmo processo.
	 */
	build(): ICreateGroups {
		const payload = structuredClone(this.groupData)
		this.groupData = GroupDataBuilder.defaults()

		return payload
	}
}
