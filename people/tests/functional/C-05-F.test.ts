import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateCode from "@core/services/people/postCreateCode.service"
import { peopleC05 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string

	before("Pessoa com um código de acesso ativo", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC05.loginParams,
		)

		const created = await peopleBusiness.createPersonWithCode(
			personBuilder
				.withName(peopleC05.casePrefix)
				.withEmail(peopleC05.casePrefix)
				.build(),
			adminParams,
		)

		personId = created.personId
	})

	it("[C-05-F] - Pessoa com código ativo não recebe um segundo código", async () => {
		const { json } = await postCreateCode(
			personId,
			peopleC05.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.statusCode,
			409,
			"Um segundo código ativo foi emitido para a mesma pessoa — o caminho correto é regenerar.",
		)
	})
})
