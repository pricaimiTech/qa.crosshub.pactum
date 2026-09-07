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
import patchUpdateProduct from "@core/services/catalog/patchUpdateProduct.service"
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

	it("[CAT-10-F] - Produto com reserva histórica não é excluído: 409 orienta a inativação, e a reserva sobrevive", async () => {
		const recusa = await deleteProduct(
			productId,
			catalogCAT10.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			recusa.json.message,
			catalogCAT10.errorMessage,
			"A recusa da exclusão não trouxe a mensagem que orienta a inativação.",
		)

		const { json } = await getReservations(
			catalogCAT10.paramsDefault200(adminParams.token),
		)

		const sobrevivente = json.filter(
			(reserva: { id: string }) => reserva.id === reservationId,
		)

		assertTs.lengthOf(
			sobrevivente,
			1,
			"A reserva concluída sumiu — o histórico de atendimento foi apagado junto com o produto.",
		)

		// A saída recomendada pela especificação continua disponível.
		const inativo = await patchUpdateProduct(
			productId,
			{ isActive: false },
			catalogCAT10.paramsDefault200(adminParams.token),
		)

		assertTs.isFalse(
			inativo.json.isActive,
			"O produto com histórico não pôde ser inativado.",
		)
	})
})
