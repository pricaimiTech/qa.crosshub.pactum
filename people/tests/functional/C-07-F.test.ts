import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListPeople from "@core/services/people/getListPeople.service"
import { peopleC07 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string
	let code: string

	before("Pessoa com código recém-criado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC07.loginParams,
		)

		const created = await peopleBusiness.createPersonWithCode(
			personBuilder
				.withName(peopleC07.casePrefix)
				.withEmail(peopleC07.casePrefix)
				.build(),
			adminParams,
		)

		personId = created.personId
		code = created.code
	})

	it("[C-07-F] - O código em texto puro aparece só na resposta da criação", async () => {
		assertTs.exists(
			code,
			"A criação do código não devolveu o texto puro, que é a única chance de exibi-lo.",
		)

		const { json } = await getListPeople(
			{},
			peopleC07.paramsDefault200(adminParams.token),
		)

		const pessoa = json.filter(
			(item: { id: string }) => item.id === personId,
		)

		assertTs.notInclude(
			JSON.stringify(pessoa),
			code,
			"O código em texto puro reapareceu em uma leitura posterior — o banco deveria guardar só o hash.",
		)
	})
})
