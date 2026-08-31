import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { peopleC03 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC03.loginParams,
		)
	})

	it("[C-03-F] - Cada campo fora do limite traz a sua própria mensagem", async () => {
		const base = personBuilder
			.withName(peopleC03.casePrefix)
			.withEmail(peopleC03.casePrefix)
			.build()

		const mensagens = await peopleBusiness.rejectedPeople(
			[
				{ ...base, notes: peopleC03.longNotes },
				{ ...base, document: peopleC03.longDocument },
				{ ...base, gender: peopleC03.invalidGender },
				{ ...base, birthDate: peopleC03.invalidBirthDate },
			],
			peopleC03.paramsDefault400(adminParams.token),
		)

		const esperadas = [
			peopleC03.messages.notes,
			peopleC03.messages.document,
			peopleC03.messages.gender,
			peopleC03.messages.birthDate,
		]

		const semAMensagem = esperadas.filter(
			(esperada, indice) => !mensagens[indice].includes(esperada),
		)

		assertTs.deepEqual(
			semAMensagem,
			[],
			"Alguma variação inválida não trouxe a mensagem específica do seu campo.",
		)
	})
})
