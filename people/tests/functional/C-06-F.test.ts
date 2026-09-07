import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postActivate from "@core/services/auth/postActivate.service"
import postRegenerateCode from "@core/services/people/postRegenerateCode.service"
import { peopleC06 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string
	let oldCode: string

	before("Pessoa com um código ativo, ainda não usado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC06.loginParams,
		)

		const created = await peopleBusiness.createPersonWithCode(
			personBuilder
				.withName(peopleC06.casePrefix)
				.withEmail(peopleC06.casePrefix)
				.build(),
			adminParams,
		)

		personId = created.personId
		oldCode = created.code
	})

	it("[C-06-F] - Regenerar cria um código novo e derruba o anterior", async () => {
		const { json } = await postRegenerateCode(
			personId,
			peopleC06.paramsDefault201(adminParams.token),
		)

		assertTs.notEqual(
			json.code,
			oldCode,
			"A regeneração devolveu o mesmo código de antes.",
		)

		// O código antigo não ativa mais (a API trata como credencial inválida,
		// 401) e o novo ativa normalmente.
		await postActivate(
			{
				slug: `${process.env.TENANT_SLUG}`,
				code: oldCode,
				password: peopleC06.pin,
				consent: true,
			},
			peopleC06.paramsDefault401(),
		)

		const ativado = await postActivate(
			{
				slug: `${process.env.TENANT_SLUG}`,
				code: json.code,
				password: peopleC06.pin,
				consent: true,
			},
			peopleC06.paramsDefault200(),
		)

		assertTs.exists(
			ativado.json.accessToken,
			"O código recém-gerado não ativou a conta do cliente.",
		)
	})
})
