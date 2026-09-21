import {
	assertTs,
	authBusiness,
	describeName,
	peopleBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postActivate from "@core/services/auth/postActivate.service"
import { peopleC17 } from "@people-data/people.data"

describe(describeName.public, () => {
	let code: string

	before(
		"Pessoa cadastrada com o mesmo e-mail do administrador do tenant",
		async () => {
			const adminParams: IParamsDefault = await authBusiness.loginAsTenantAdmin(
				`${process.env.TENANT_SLUG}`,
				`${process.env.TENANT_EMAIL}`,
				`${process.env.TENANT_PASSWORD}`,
				peopleC17.loginParams,
			)

			const created = await peopleBusiness.ensurePersonWithCode(
				`${process.env.TENANT_EMAIL}`,
				personBuilder
					.withName(peopleC17.casePrefix)
					.withExactEmail(`${process.env.TENANT_EMAIL}`)
					.build(),
				adminParams,
			)

			code = created.code
		},
	)

	it("[C-17-F] - Ativação com o e-mail do administrador responde 409 dizendo o motivo, não 500", async () => {
		const { json } = await postActivate(
			{
				slug: `${process.env.TENANT_SLUG}`,
				code,
				password: peopleC17.pin,
				consent: true,
			},
			peopleC17.paramsDefault409(),
		)

		assertTs.equal(
			json.message,
			peopleC17.adminMessage,
			"A ativação não explicou que o e-mail já é do administrador — quem ativa não tem como adivinhar isso.",
		)
	})
})
