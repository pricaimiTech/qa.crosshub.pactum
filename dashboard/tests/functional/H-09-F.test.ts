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
import getHome from "@core/services/dashboard/getHome.service"
import postBackdate from "@core/services/fixtures/postBackdate.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { homeH09 } from "@dashboard-data/home.data"

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let paradaHa4Dias: string
	let paradaHa1Dia: string

	before("Tenant reservado com reservas pendentes sem ação há 1 e há 4 dias", async () => {
		const tenant = tenantFor(homeH09.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			homeH09.loginParams,
		)

		const client = await peopleBusiness.createActivatedPerson(
			personBuilder.withName(homeH09.casePrefix).withEmail("h09").build(),
			tenant.slug,
			homeH09.clientPassword,
			adminParams,
		)

		const produto = await catalogBusiness.createProduct(
			productBuilder.withName(homeH09.casePrefix).build(),
			adminParams,
		)

		const criar = async (nota: string, dias: number) => {
			const { reservation } = await catalogBusiness.reserveAsClient(
				client,
				tenant.slug,
				produto.id,
				`${homeH09.casePrefix} ${nota}`,
				adminParams,
			)
			await postBackdate(
				{ entity: "reservation", id: reservation.id, at: daysAgo(dias) },
				homeH09.paramsDefault201(adminParams.token),
			)
			return reservation.id
		}

		paradaHa4Dias = await criar("4 dias", homeH09.outsideWindowDays)
		paradaHa1Dia = await criar("1 dia", homeH09.insideWindowDays)
	})

	it("[H-09-F] - O alerta de atraso traz só a reserva pendente sem ação há mais de 48 h", async () => {
		const { json } = await getHome(homeH09.paramsDefault200(adminParams.token))

		// A API identifica o item como `pending:<id>` e aponta o destino para a reserva.
		const ids = json.alerts.overdue.map(
			(item: { destination: { id?: string } }) => item.destination.id,
		)

		assertTs.include(ids, paradaHa4Dias, "A reserva pendente há 4 dias não entrou no alerta de atraso.")
		assertTs.notInclude(ids, paradaHa1Dia, "A reserva pendente há 1 dia entrou no alerta de atraso.")
	})
})
