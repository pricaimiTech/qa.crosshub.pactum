import {
	assertTs,
	authBusiness,
	catalogBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
	productBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchUpdateReservation from "@core/services/catalog/patchUpdateReservation.service"
import getHome from "@core/services/dashboard/getHome.service"
import getReservations from "@core/services/catalog/getReservations.service"
import postBackdate from "@core/services/fixtures/postBackdate.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { homeH01 } from "@dashboard-data/home.data"

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let dentroId: string
	let foraId: string
	let canceladaId: string

	before("Tenant reservado com reservas de 23 h, de 25 h e uma cancelada dentro da janela", async () => {
		const tenant = tenantFor(homeH01.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			homeH01.loginParams,
		)

		// O tenant reservado não tem cliente no pool: uma ativação, só aqui.
		const client = await peopleBusiness.createActivatedPerson(
			personBuilder.withName(homeH01.casePrefix).withEmail("h01").build(),
			tenant.slug,
			homeH01.clientPassword,
			adminParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(homeH01.casePrefix).build(),
			adminParams,
		)

		const reservas = []
		for (const nota of ["dentro", "fora", "cancelada"]) {
			const { reservation } = await catalogBusiness.reserveAsClient(
				client,
				tenant.slug,
				produto.id,
				`${homeH01.casePrefix} ${nota}`,
				adminParams,
			)
			reservas.push(reservation.id)
		}
		const [dentro, fora, cancelada] = reservas
		dentroId = dentro
		foraId = fora
		canceladaId = cancelada

		await postBackdate(
			{ entity: "reservation", id: dentro, at: hoursAgo(homeH01.insideWindowHours) },
			homeH01.paramsDefault201(adminParams.token),
		)
		await postBackdate(
			{ entity: "reservation", id: fora, at: hoursAgo(homeH01.outsideWindowHours) },
			homeH01.paramsDefault201(adminParams.token),
		)
		await patchUpdateReservation(
			cancelada,
			{ status: "cancelled", cancellationReason: homeH01.cancellationReason },
			homeH01.paramsDefault200(adminParams.token),
		)
	})

	it("[H-01-F] - A janela de 24 h conta só a reserva de 23 h: a de 25 h fica fora e a cancelada é excluída", async () => {
		const { json } = await getHome(homeH01.paramsDefault200(adminParams.token))
		const reservas = await getReservations(homeH01.paramsDefault200(adminParams.token))

		// O tenant reservado acumula massa entre execuções; a prova do corte é a
		// métrica bater com a contagem feita pela própria janela que a API declara.
		const desde = Date.parse(json.periods.recentSince)
		const contadas = reservas.json.filter(
			(reserva: { createdAt: string; status: string }) =>
				Date.parse(reserva.createdAt) > desde && reserva.status !== "cancelled",
		)
		const ids = contadas.map((reserva: { id: string }) => reserva.id)

		assertTs.include(ids, dentroId, "A reserva de 23 h ficou fora da janela de 24 h.")
		assertTs.notInclude(ids, foraId, "A reserva de 25 h entrou na janela de 24 h.")
		assertTs.notInclude(ids, canceladaId, "A reserva cancelada foi contada como nova.")
		assertTs.equal(
			json.metrics.newReservations,
			contadas.length,
			"A métrica não bate com a contagem das reservas não canceladas dentro de `periods.recentSince`.",
		)
	})
})
