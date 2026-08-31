import {
	assertTs,
	authBusiness,
	describeName,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { peopleC02 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC02.loginParams,
		)
	})

	it(`[C-02-F]${bugTag(peopleC02.knownBug)} - E-mail é normalizado e telefone vazio vira null`, async () => {
		const { json } = await postCreatePerson(
			{
				name: personBuilder.withName(peopleC02.casePrefix).build().name,
				email: peopleC02.rawEmail,
				phone: peopleC02.rawPhone,
			},
			peopleC02.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			json.email,
			peopleC02.expectedEmail,
			"O e-mail não foi normalizado para minúsculas e sem espaços.",
		)

		assertTs.isNull(
			json.phone,
			bugMessage(
				"O telefone vazio virou string vazia em vez de null.",
				peopleC02.knownBug,
			),
		)
	})
})
