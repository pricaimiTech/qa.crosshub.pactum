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
import { catalogCAT11 } from "@catalog-data/catalog.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let reservationId: string

	before("Reserva recém-criada, em pending", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			catalogCAT11.loginParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(catalogCAT11.casePrefix).build(),
			adminParams,
		)

		const reservada = await catalogBusiness.reserveAsClient(
			endUsersFor(catalogCAT11.caseId)[0],
			`${process.env.TENANT_SLUG}`,
			produto.id,
			catalogCAT11.note,
			adminParams,
		)

		reservationId = reservada.reservation.id
	})

	it("[CAT-11-F] - A reserva avança pending → in_progress → confirmed → completed e não volta", async () => {
		const aplicados = await catalogBusiness.advanceReservation(
			reservationId,
			catalogCAT11.forwardFlow,
			catalogCAT11.paramsDefault200(adminParams.token),
		)

		assertTs.deepEqual(
			aplicados,
			catalogCAT11.forwardFlow,
			"A reserva não percorreu a sequência de status especificada.",
		)

		const { json } = await patchUpdateReservation(
			reservationId,
			{ status: catalogCAT11.backwardStatus },
			catalogCAT11.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.message,
			catalogCAT11.errorMessage,
			"A tentativa de voltar o status não trouxe a mensagem especificada.",
		)
	})
})
