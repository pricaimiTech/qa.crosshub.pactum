import { faker } from "@faker-js/faker"
import type { ICategoryInput } from "../../interface/catalog/ICatalog.interface"

/** Payload de `POST /dashboard/categories`. */
export default class CategoryDataBuilder {
	private categoryData: ICategoryInput

	constructor() {
		this.categoryData = CategoryDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICategoryInput {
		return {
			name: `[QA] Categoria ${faker.string.alphanumeric(8)}`,
			description: "",
			isActive: true,
		}
	}

	/**
	 * Define o nome da categoria, sufixado para não colidir entre execuções
	 * @param name - Prefixo do nome, normalmente o ID do caso de teste
	 */
	withName(name: string): CategoryDataBuilder {
		this.categoryData.name = `${name} ${faker.string.alphanumeric(8)}`
		return this
	}

	/**
	 * Fixa o nome exatamente como recebido, sem sufixo.
	 *
	 * O caso de unicidade precisa enviar **o mesmo** nome duas vezes.
	 * @param name - Nome literal da categoria
	 */
	withExactName(name: string): CategoryDataBuilder {
		this.categoryData.name = name
		return this
	}

	/**
	 * Define se a categoria aceita vínculo de produto
	 * @param isActive - `false` impede novos vínculos
	 */
	withIsActive(isActive: boolean): CategoryDataBuilder {
		this.categoryData.isActive = isActive
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**, porque o Mocha em
	 * paralelo roda vários arquivos de teste no mesmo processo.
	 */
	build(): ICategoryInput {
		const payload = structuredClone(this.categoryData)
		this.categoryData = CategoryDataBuilder.defaults()

		return payload
	}
}
