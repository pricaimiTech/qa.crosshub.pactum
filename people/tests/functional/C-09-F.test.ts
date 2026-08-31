import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getPublicSession from "@core/services/auth/getPublicSession.service"
import postActivate from "@core/services/auth/postActivate.service"
import { peopleC09 } from "@people-data/people.data"

describe(describeName.public, () => {
	let personId: string
	let code: string

	before("Pessoa com código de acesso válido, ainda não usado", async () => {
		const adminParams: IParamsDefault =
			await authBusiness.loginAsTenantAdmin(
				`${process.env.TENANT_SLUG}`,
				`${process.env.TENANT_EMAIL}`,
				`${process.env.TENANT_PASSWORD}`,
				peopleC09.loginParams,
			)

		const created = await peopleBusiness.createPersonWithCode(
			personBuilder
				.withName(peopleC09.casePrefix)
				.withEmail(peopleC09.casePrefix)
				.build(),
			adminParams,
		)

		personId = created.personId
		code = created.code
	})

	it("[C-09-F] - Ativação devolve token, consome o código e cria a conta do cliente", async () => {
		const { json } = await postActivate(
			{
				slug: `${process.env.TENANT_SLUG}`,
				code,
				password: peopleC09.pin,
				consent: true,
			},
			peopleC09.paramsDefault201(),
		)

		assertTs.exists(
			json.accessToken,
			"A ativação não devolveu accessToken.",
		)

		// O código foi consumido: a segunda tentativa não ativa mais.
		await postActivate(
			{
				slug: `${process.env.TENANT_SLUG}`,
				code,
				password: peopleC09.pin,
				consent: true,
			},
			peopleC09.paramsDefault401(),
		)

		const sessao = await getPublicSession(
			peopleC09.paramsDefault200(json.accessToken),
		)

		assertTs.equal(
			sessao.json.personId,
			personId,
			"A sessão do cliente não aponta para a pessoa que recebeu o código.",
		)
	})
})
