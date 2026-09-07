import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreateCode from "@core/services/people/postCreateCode.service"
import { peopleC04 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string

	before("Pessoa sem e-mail e sem telefone", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC04.loginParams,
		)

		personId = await peopleBusiness.createPersonWithoutContact(
			personBuilder.withName(peopleC04.casePrefix).build(),
			peopleC04.paramsDefault201(adminParams.token),
		)
	})

	it(`[C-04-F] - Sem canal de contato, o código de acesso não é emitido`, async () => {
		const { json } = await postCreateCode(
			personId,
			peopleC04.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.statusCode,
			409,
			"A recusa do código para pessoa sem canal de contato não veio como 409.",
		)
	})
})
