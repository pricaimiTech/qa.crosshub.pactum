import { faker } from "@faker-js/faker"
import type { ICreateProduct } from "../../interface/catalog/ICatalog.interface"

/** Payload de `POST /dashboard/products`. */
export default class ProductDataBuilder {
	private productData: ICreateProduct

	constructor() {
		this.productData = ProductDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICreateProduct {
		return {
			name: `[QA] Produto ${faker.string.alphanumeric(8)}`,
			description: "",
			isActive: true,
		}
	}

	/**
	 * Define o nome do produto, sufixado para não colidir entre execuções
	 * @param name - Prefixo do nome, normalmente o ID do caso de teste
	 */
	withName(name: string): ProductDataBuilder {
		this.productData.name = `${name} ${faker.string.alphanumeric(8)}`
		return this
	}

	/**
	 * Vincula o produto a uma categoria
	 * @param categoryId - Categoria de destino
	 */
	withCategory(categoryId: string): ProductDataBuilder {
		this.productData.categoryId = categoryId
		return this
	}

	/**
	 * Define o preço do produto
	 * @param priceCents - Preço em centavos, sempre inteiro
	 */
	withPriceCents(priceCents: number): ProductDataBuilder {
		this.productData.priceCents = priceCents
		return this
	}

	/**
	 * Define se o produto aparece no catálogo público
	 * @param isActive - `false` some da vitrine e recusa reserva
	 */
	withIsActive(isActive: boolean): ProductDataBuilder {
		this.productData.isActive = isActive
		return this
	}

	/**
	 * Vincula a imagem enviada pelo upload
	 * @param imageKey - Chave devolvida por `POST /dashboard/products/uploads`
	 */
	withImageKey(imageKey: string): ProductDataBuilder {
		this.productData.imageKey = imageKey
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**, porque o Mocha em
	 * paralelo roda vários arquivos de teste no mesmo processo.
	 */
	build(): ICreateProduct {
		const payload = structuredClone(this.productData)
		this.productData = ProductDataBuilder.defaults()

		return payload
	}
}
