import {
	assertTs,
	authBusiness,
	describeName,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { peopleC01 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC01.loginParams,
		)
	})

	it("[C-01-F] - Cadastro só com nome e e-mail nasce ativo, com os opcionais nulos", async () => {
		const { json } = await postCreatePerson(
			personBuilder
				.withName(peopleC01.casePrefix)
				.withEmail(peopleC01.casePrefix)
				.build(),
			peopleC01.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			json.status,
			peopleC01.expectedStatus,
			"A pessoa recém-cadastrada não nasceu com status active.",
		)

		const preenchidos = peopleC01.nullableFields.filter(
			(campo) => json[campo] !== null,
		)

		assertTs.deepEqual(
			preenchidos,
			[],
			"Algum campo opcional veio preenchido em um cadastro que só informou nome e e-mail.",
		)
	})
})
