import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getPublicMyReservations from "@core/services/public/getPublicMyReservations.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { catalogCAT14 } from "@catalog-data/catalog.data"

describe(describeName.public, () => {
	let adminParams: IParamsDefault
	let productId: string

	before("Produto disponível para reserva", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT14.loginParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCAT14.casePrefix).build(),
			adminParams,
		)

		productId = produto.id
	})

	it("[CAT-14-F] - A reserva é criada e aparece para o cliente, independentemente do envio de e-mail", async () => {
		const reservada = await catalogBusiness.reserveAsClient(
			endUsersFor(catalogCAT14.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			productId,
			catalogCAT14.note,
			adminParams,
		)

		assertTs.exists(
			reservada.reservation.id,
			"A reserva não foi criada.",
		)

		// A confirmação por e-mail é efeito colateral: se falhar, fica no log e a
		// reserva permanece. O que se prova aqui é a persistência.
		const { json } = await getPublicMyReservations(
			catalogCAT14.paramsDefault200(reservada.clientToken),
		)

		const minha = json.filter(
			(reserva: { id: string }) => reserva.id === reservada.reservation.id,
		)

		assertTs.lengthOf(
			minha,
			1,
			"A reserva criada não aparece na lista do cliente.",
		)
	})
})
