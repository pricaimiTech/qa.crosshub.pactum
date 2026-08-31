import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postActivate from "@core/services/auth/postActivate.service"
import postPublicLogin from "@core/services/auth/postPublicLogin.service"
import getListPeople from "@core/services/people/getListPeople.service"
import postRemoveAccess from "@core/services/people/postRemoveAccess.service"
import { peopleC12 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string
	let email: string

	before("Cliente com conta ativa", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC12.loginParams,
		)

		const person = personBuilder
			.withName(peopleC12.casePrefix)
			.withEmail(peopleC12.casePrefix)
			.build()

		email = `${person.email}`

		const created = await peopleBusiness.createPersonWithCode(
			person,
			adminParams,
		)

		personId = created.personId

		await postActivate(
			{
				slug: `${process.env.TENANT_SLUG}`,
				code: created.code,
				password: peopleC12.pin,
				consent: true,
			},
			peopleC12.paramsDefault201(),
		)
	})

	it("[C-12-F] - Remover acesso revoga a pessoa, derruba o login e preserva o cadastro", async () => {
		await postRemoveAccess(
			personId,
			peopleC12.paramsDefault201(adminParams.token),
		)

		// A resposta da rota é enxuta (`RemovedAccessDto`, só id e nome), então a
		// revogação é conferida no cadastro.
		const pessoas = await getListPeople(
			peopleC12.paramsDefault200(adminParams.token),
		)

		const cadastro = pessoas.json.filter(
			(item: { id: string }) => item.id === personId,
		)[0]

		assertTs.equal(
			cadastro.status,
			peopleC12.expectedStatus,
			"A pessoa não ficou com status revoked depois de remover o acesso.",
		)

		assertTs.exists(
			cadastro.name,
			"O cadastro foi apagado junto com o acesso — ele deveria ser preservado.",
		)

		await postPublicLogin(
			{
				slug: `${process.env.TENANT_SLUG}`,
				email,
				password: peopleC12.pin,
			},
			peopleC12.paramsDefault401(),
		)
	})
})
