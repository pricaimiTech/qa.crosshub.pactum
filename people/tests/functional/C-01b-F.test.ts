import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { peopleC01b } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC01b.loginParams,
		)
	})

	it("[C-01b-F] - Cadastro sem e-mail é recusado", async () => {
		const mensagens = await peopleBusiness.rejectedPeople(
			[{ name: personBuilder.withName(peopleC01b.casePrefix).build().name }],
			peopleC01b.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			mensagens[0],
			peopleC01b.errorMessage,
			"O cadastro sem e-mail não trouxe a mensagem especificada.",
		)
	})
})
