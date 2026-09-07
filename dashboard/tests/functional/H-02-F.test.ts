import { assertTs, authBusiness, describeName, personBuilder } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getHome from "@core/services/dashboard/getHome.service"
import getListPeople from "@core/services/people/getListPeople.service"
import postBackdate from "@core/services/fixtures/postBackdate.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { homeH02 } from "@dashboard-data/home.data"

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let dentroId: string
	let foraId: string

	before("Tenant reservado com cadastros de 6 e de 8 dias", async () => {
		const tenant = tenantFor(homeH02.caseId)

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			homeH02.loginParams,
		)

		const dentro = await postCreatePerson(
			personBuilder.withName(`${homeH02.casePrefix} dentro`).withEmail("h02-dentro").build(),
			homeH02.paramsDefault201(adminParams.token),
		)
		const fora = await postCreatePerson(
			personBuilder.withName(`${homeH02.casePrefix} fora`).withEmail("h02-fora").build(),
			homeH02.paramsDefault201(adminParams.token),
		)

		dentroId = dentro.json.id
		foraId = fora.json.id

		await postBackdate(
			{ entity: "person", id: dentro.json.id, at: daysAgo(homeH02.insideWindowDays) },
			homeH02.paramsDefault201(adminParams.token),
		)
		await postBackdate(
			{ entity: "person", id: fora.json.id, at: daysAgo(homeH02.outsideWindowDays) },
			homeH02.paramsDefault201(adminParams.token),
		)
	})

	it("[H-02-F] - A janela de 7 dias conta o cadastro de 6 dias e exclui o de 8", async () => {
		const { json } = await getHome(homeH02.paramsDefault200(adminParams.token))
		const pessoas = await getListPeople({}, homeH02.paramsDefault200(adminParams.token))

		// O tenant reservado acumula massa entre execuções; a prova do corte é a
		// métrica bater com a contagem feita pela própria janela que a API declara.
		const desde = Date.parse(json.periods.peopleSince)
		const dentroDaJanela = pessoas.json.filter(
			(pessoa: { createdAt: string }) => Date.parse(pessoa.createdAt) > desde,
		)
		const ids = dentroDaJanela.map((pessoa: { id: string }) => pessoa.id)

		assertTs.include(ids, dentroId, "O cadastro de 6 dias ficou fora da janela de 7 dias.")
		assertTs.notInclude(ids, foraId, "O cadastro de 8 dias entrou na janela de 7 dias.")
		assertTs.equal(
			json.metrics.newPeopleLast7Days,
			dentroDaJanela.length,
			"A métrica não bate com a contagem dos cadastros dentro de `periods.peopleSince`.",
		)
	})
})
