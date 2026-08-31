import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListPeople from "@core/services/people/getListPeople.service"
import getPublicSession from "@core/services/auth/getPublicSession.service"
import postActivate from "@core/services/auth/postActivate.service"
import { peopleC11 } from "@people-data/people.data"

describe(describeName.public, () => {
	let adminParams: IParamsDefault
	let personId: string
	let registeredName: string
	let code: string

	before("Pessoa cadastrada com um nome, prestes a ativar com outro", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC11.loginParams,
		)

		const person = personBuilder
			.withName(peopleC11.casePrefix)
			.withEmail(peopleC11.casePrefix)
			.build()

		registeredName = person.name

		const created = await peopleBusiness.createPersonWithCode(
			person,
			adminParams,
		)

		personId = created.personId
		code = created.code
	})

	it("[C-11-F] - O nome informado na ativação vira nome social e não sobrescreve o cadastro", async () => {
		const ativado = await postActivate(
			{
				slug: `${process.env.TENANT_SLUG}`,
				code,
				password: peopleC11.pin,
				consent: true,
				name: peopleC11.socialName,
			},
			peopleC11.paramsDefault201(),
		)

		const pessoas = await getListPeople(
			peopleC11.paramsDefault200(adminParams.token),
		)

		const cadastro = pessoas.json.filter(
			(item: { id: string }) => item.id === personId,
		)[0]

		assertTs.equal(
			cadastro.name,
			registeredName,
			"O nome informado na ativação sobrescreveu o nome do cadastro.",
		)

		const sessao = await getPublicSession(
			peopleC11.paramsDefault200(ativado.json.accessToken),
		)

		assertTs.equal(
			sessao.json.personName,
			peopleC11.socialName,
			"A sessão do cliente não exibe o nome social informado na ativação.",
		)
	})
})
