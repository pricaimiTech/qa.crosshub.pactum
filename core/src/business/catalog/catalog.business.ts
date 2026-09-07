import { preSetup } from "../../constants"
import type {
	ICategoryInput,
	ICreateProduct,
} from "../../interface/catalog/ICatalog.interface"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IPooledEndUser } from "../../utils/endUser.utils"
import AuthBusiness from "../auth/auth.business"
import patchUpdateReservation from "../../services/catalog/patchUpdateReservation.service"
import postCreateCategory from "../../services/catalog/postCreateCategory.service"
import postCreateProduct from "../../services/catalog/postCreateProduct.service"
import postPublicReserveProduct from "../../services/public/postPublicReserveProduct.service"

/** Produto como devolvido pela API. */
export interface IProductSummary {
	id: string
	name: string
	categoryId: string | null
	priceCents: number | null
	isActive: boolean
	imageUrl?: string | null
}

/** Reserva como devolvida pela API. */
export interface IReservationSummary {
	id: string
	productId: string
	personId: string
	status: string
	cancellationReason: string | null
	cancelledBy: string | null
}

export default class CatalogBusiness {
	/**
	 * Cria uma categoria e devolve o id.
	 * @param category - Payload, vindo do `CategoryDataBuilder`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id da categoria criada
	 */
	public async createCategory(
		category: ICategoryInput,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const response = await postCreateCategory(
			category,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)

		return response.json.id
	}

	/**
	 * Cria um produto e devolve o registro completo.
	 * @param product - Payload, vindo do `ProductDataBuilder`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Produto criado
	 */
	public async createProduct(
		product: ICreateProduct,
		paramsDefault: IParamsDefault,
	): Promise<IProductSummary> {
		const response = await postCreateProduct(
			product,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)

		return response.json
	}

	/**
	 * Cria N produtos iguais e devolve os ids.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for`.
	 * @param products - Payloads, um por produto
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Ids dos produtos criados, na ordem enviada
	 */
	public async createProducts(
		products: Array<ICreateProduct>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const ids: Array<string> = []

		for (const product of products) {
			const created = await this.createProduct(product, paramsDefault)
			ids.push(created.id)
		}

		return ids
	}

	/**
	 * Reserva um produto como cliente final.
	 * @param client - Cliente do pool
	 * @param slug - Slug do tenant
	 * @param productId - Produto reservado
	 * @param note - Observação enviada na reserva
	 * @param paramsDefault - Parâmetros padrão base
	 * @returns Reserva criada e o token do cliente, para as ações seguintes
	 */
	public async reserveAsClient(
		client: IPooledEndUser,
		slug: string,
		productId: string,
		note: string,
		paramsDefault: IParamsDefault,
	): Promise<{ reservation: IReservationSummary; clientToken?: string }> {
		const authBusiness = new AuthBusiness()

		const clientParams = await authBusiness.loginAsEndUser(
			slug,
			client.email,
			client.password,
			preSetup.preSetupParamsDefault(
				200,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
			),
		)

		const response = await postPublicReserveProduct(
			productId,
			{ note },
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				clientParams.token,
			),
		)

		return { reservation: response.json, clientToken: clientParams.token }
	}

	/**
	 * Percorre uma sequência de status e devolve o resultado de cada passo.
	 *
	 * A máquina de estados da reserva (`CAT-11`) precisa avançar passo a passo, e
	 * o laço não pode morar no arquivo de teste.
	 * @param reservationId - Reserva alvo
	 * @param statuses - Status a aplicar, na ordem
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Status devolvido em cada passo
	 */
	public async advanceReservation(
		reservationId: string,
		statuses: Array<"in_progress" | "confirmed" | "completed" | "cancelled">,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const applied: Array<string> = []

		for (const status of statuses) {
			const response = await patchUpdateReservation(
				reservationId,
				{ status },
				paramsDefault,
			)

			applied.push(response.json.status)
		}

		return applied
	}

	/**
	 * Tenta criar produtos inválidos e devolve a mensagem de cada tentativa.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for`.
	 * @param products - Payloads inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, já serializada
	 */
	public async rejectedProducts(
		products: Array<ICreateProduct>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const product of products) {
			const response = await postCreateProduct(product, paramsDefault)
			messages.push(JSON.stringify(response.json.message))
		}

		return messages
	}

	/**
	 * Tenta criar categorias inválidas e devolve a mensagem de cada tentativa.
	 * @param categories - Payloads inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, já serializada
	 */
	public async rejectedCategories(
		categories: Array<ICategoryInput>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const category of categories) {
			const response = await postCreateCategory(category, paramsDefault)
			messages.push(JSON.stringify(response.json.message))
		}

		return messages
	}
}
