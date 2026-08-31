import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateCode from "@core/services/people/postCreateCode.service"
import postRemoveAccess from "@core/services/people/postRemoveAccess.service"
import { peopleC08 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string

	before("Pessoa com o acesso removido", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC08.loginParams,
		)

		const created = await peopleBusiness.createPersonWithCode(
			personBuilder
				.withName(peopleC08.casePrefix)
				.withEmail(peopleC08.casePrefix)
				.build(),
			adminParams,
		)

		personId = created.personId

		await postRemoveAccess(
			personId,
			peopleC08.paramsDefault201(adminParams.token),
		)
	})

	it("[C-08-F] - Pessoa revogada não recebe código de acesso novo", async () => {
		const { json } = await postCreateCode(
			personId,
			peopleC08.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.statusCode,
			409,
			"Um código de acesso foi emitido para uma pessoa com acesso revogado.",
		)
	})
})
