import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { peopleC10 } from "@people-data/people.data"

describe(describeName.public, () => {
	let code: string

	before("Pessoa com código de acesso válido, ainda não usado", async () => {
		const adminParams: IParamsDefault =
			await authBusiness.loginAsTenantAdmin(
				`${process.env.TENANT_SLUG}`,
				`${process.env.TENANT_EMAIL}`,
				`${process.env.TENANT_PASSWORD}`,
				peopleC10.loginParams,
			)

		const created = await peopleBusiness.createPersonWithCode(
			personBuilder
				.withName(peopleC10.casePrefix)
				.withEmail(peopleC10.casePrefix)
				.build(),
			adminParams,
		)

		code = created.code
	})

	it("[C-10-F] - PIN fora do formato e consentimento negado não ativam a conta", async () => {
		const slug = `${process.env.TENANT_SLUG}`

		const mensagens = await peopleBusiness.rejectedActivations(
			[
				{ slug, code, password: peopleC10.shortPin, consent: true },
				{ slug, code, password: peopleC10.longPin, consent: true },
				{ slug, code, password: peopleC10.nonNumericPin, consent: true },
				{ slug, code, password: peopleC10.pin, consent: false },
			],
			peopleC10.paramsDefault400(),
		)

		const pinForaDoPadrao = mensagens
			.slice(0, 3)
			.filter((mensagem) => !mensagem.includes(peopleC10.pinMessage))

		assertTs.deepEqual(
			pinForaDoPadrao,
			[],
			"Alguma variação de PIN inválido não trouxe a mensagem especificada.",
		)

		assertTs.include(
			mensagens[3],
			peopleC10.consentMessage,
			"A ativação sem consentimento não trouxe a mensagem especificada.",
		)
	})
})
