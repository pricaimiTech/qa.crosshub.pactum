import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import deleteProduct from "@core/services/catalog/deleteProduct.service"
import getReservations from "@core/services/catalog/getReservations.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { catalogCAT10 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let productId: string
	let reservationId: string

	before("Produto com uma reserva já concluída", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT10.loginParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCAT10.casePrefix).build(),
			adminParams,
		)

		productId = produto.id

		const reservada = await catalogBusiness.reserveAsClient(
			endUsersFor(catalogCAT10.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			productId,
			catalogCAT10.note,
			adminParams,
		)

		reservationId = reservada.reservation.id

		await catalogBusiness.advanceReservation(
			reservationId,
			["in_progress", "confirmed", "completed"],
			catalogCAT10.paramsDefault200(adminParams.token),
		)
	})

	it("[CAT-10-F] - Produto com reserva histórica é excluído, e a reserva vai junto", async () => {
		await deleteProduct(
			productId,
			catalogCAT10.paramsDefault200(adminParams.token),
		)

		const { json } = await getReservations(
			catalogCAT10.paramsDefault200(adminParams.token),
		)

		const sobrevivente = json.filter(
			(reserva: { id: string }) => reserva.id === reservationId,
		)

		// O comportamento real é a cascata: o histórico some junto com o produto.
		// A especificação recomenda inativar em vez de excluir; o caso registra o
		// que a API faz hoje e fica vermelho se isso mudar.
		assertTs.lengthOf(
			sobrevivente,
			0,
			"A reserva concluída sobreviveu à exclusão do produto — o comportamento mudou em relação ao registrado.",
		)
	})
})
