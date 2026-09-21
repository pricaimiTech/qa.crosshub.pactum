import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { peopleC18 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Cliente já cadastrado com o e-mail do caso", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC18.loginParams,
		)

		await peopleBusiness.createPerson(
			personBuilder
				.withName(peopleC18.casePrefix)
				.withExactEmail(peopleC18.sharedEmail)
				.build(),
			adminParams,
		)
	})

	it("[C-18-F] - E-mail de cliente repetido é recusado com 409, inclusive em requisições simultâneas", async () => {
		const { json } = await postCreatePerson(
			personBuilder
				.withName(peopleC18.casePrefix)
				.withExactEmail(peopleC18.sharedEmail)
				.build(),
			peopleC18.paramsDefault409(adminParams.token),
		)

		assertTs.equal(
			json.message,
			peopleC18.duplicateMessage,
			"O e-mail repetido não trouxe a mensagem de negócio.",
		)

		// A consulta prévia não segura duas requisições ao mesmo tempo: as duas
		// passam por ela antes de qualquer insert. Quem segura é o índice único.
		const simultaneas = await peopleBusiness.createPeopleRace(
			personBuilder
				.withName(peopleC18.casePrefix)
				.withExactEmail(`corrida-${peopleC18.sharedEmail}`)
				.build(),
			adminParams,
		)

		assertTs.deepEqual(
			simultaneas.sort((left, right) => left - right),
			[201, 409],
			`Duas criações simultâneas com o mesmo e-mail deveriam terminar em 201 e 409. Vieram: ${simultaneas.join(", ")}.`,
		)
	})
})
