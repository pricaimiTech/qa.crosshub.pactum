import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchUpdateReservation from "@core/services/catalog/patchUpdateReservation.service"
import { endUsersFor } from "@core/utils/endUser.utils"
import { catalogCAT12 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let reservationId: string

	before("Reserva recém-criada, em pending", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT12.loginParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCAT12.casePrefix).build(),
			adminParams,
		)

		const reservada = await catalogBusiness.reserveAsClient(
			endUsersFor(catalogCAT12.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			produto.id,
			catalogCAT12.note,
			adminParams,
		)

		reservationId = reservada.reservation.id
	})

	it("[CAT-12-F] - Cancelar sem motivo ou com motivo longo demais é recusado; com motivo válido, grava admin", async () => {
		const semMotivo = await patchUpdateReservation(
			reservationId,
			{ status: "cancelled" },
			catalogCAT12.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(semMotivo.json.message),
			catalogCAT12.missingReasonMessage,
			"O cancelamento sem motivo não trouxe a mensagem especificada.",
		)

		const motivoLongo = await patchUpdateReservation(
			reservationId,
			{ status: "cancelled", cancellationReason: catalogCAT12.longReason },
			catalogCAT12.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(motivoLongo.json.message),
			catalogCAT12.longReasonMessage,
			"O motivo acima de 1000 caracteres não trouxe a mensagem especificada.",
		)

		const { json } = await patchUpdateReservation(
			reservationId,
			{ status: "cancelled", cancellationReason: catalogCAT12.validReason },
			catalogCAT12.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			json.cancelledBy,
			catalogCAT12.expectedCancelledBy,
			"O cancelamento pelo painel não foi atribuído ao admin.",
		)

		assertTs.equal(
			json.cancellationReason,
			catalogCAT12.validReason,
			"O motivo do cancelamento não foi gravado.",
		)
	})
})
