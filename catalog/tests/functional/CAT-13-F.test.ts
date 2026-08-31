import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchPublicCancelReservation from "@core/services/public/patchPublicCancelReservation.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { catalogCAT13 } from "@catalog-data/catalog.data"

describe(describeName.public, () => {
	let adminParams: IParamsDefault
	let ownerToken: string
	let otherClientToken: string
	let pendingReservationId: string
	let advancedReservationId: string

	before("Duas reservas do mesmo cliente: uma em pending, outra já em andamento", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT13.loginParams,
		)

		const clients = endUsersFor(catalogCAT13.caseId)

		const primeiro = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCAT13.casePrefix).build(),
			adminParams,
		)
		const segundo = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCAT13.casePrefix).build(),
			adminParams,
		)

		const emPending = await catalogBusiness.reserveAsClient(
			clients[0],
			`${process.env.TENANT_SLUG}`,
			primeiro.id,
			catalogCAT13.note,
			adminParams,
		)

		pendingReservationId = emPending.reservation.id
		ownerToken = `${emPending.clientToken}`

		const emAndamento = await catalogBusiness.reserveAsClient(
			clients[0],
			`${process.env.TENANT_SLUG}`,
			segundo.id,
			catalogCAT13.note,
			adminParams,
		)

		advancedReservationId = emAndamento.reservation.id

		await catalogBusiness.advanceReservation(
			advancedReservationId,
			["in_progress"],
			catalogCAT13.paramsDefault200(adminParams.token),
		)

		const outroCliente = await authBusiness.loginAsEndUser(
			`${process.env.TENANT_SLUG}`,
			clients[1].email,
			clients[1].password,
			catalogCAT13.loginParams,
		)

		otherClientToken = `${outroCliente.token}`
	})

	it("[CAT-13-F] - Cliente cancela só a própria reserva, e só enquanto ela está nova", async () => {
		const foraDoPrazo = await patchPublicCancelReservation(
			advancedReservationId,
			{ reason: catalogCAT13.clientReason },
			catalogCAT13.paramsDefault409(ownerToken),
		)

		assertTs.equal(
			foraDoPrazo.json.message,
			catalogCAT13.errorMessage,
			"O cancelamento de reserva já em andamento não trouxe a mensagem especificada.",
		)

		await patchPublicCancelReservation(
			pendingReservationId,
			{ reason: catalogCAT13.clientReason },
			catalogCAT13.paramsDefault404(otherClientToken),
		)

		const { json } = await patchPublicCancelReservation(
			pendingReservationId,
			{ reason: catalogCAT13.clientReason },
			catalogCAT13.paramsDefault200(ownerToken),
		)

		assertTs.equal(
			json.cancelledBy,
			catalogCAT13.expectedCancelledBy,
			"O cancelamento pelo app não foi atribuído ao cliente.",
		)
	})
})
