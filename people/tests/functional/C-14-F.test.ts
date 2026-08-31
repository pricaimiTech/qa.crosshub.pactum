import {
	assertTs,
	authBusiness,
	describeName,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchUpdatePerson from "@core/services/people/patchUpdatePerson.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import postUploadPhoto from "@core/services/people/postUploadPhoto.service"
import { writeJpeg } from "@core/utils/file.utils"
import { peopleC14 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string
	let personName: string

	before("Pessoa com foto enviada", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC14.loginParams,
		)

		const person = personBuilder
			.withName(peopleC14.casePrefix)
			.withEmail(peopleC14.casePrefix)
			.build()

		personName = person.name

		personId = (
			await postCreatePerson(
				person,
				peopleC14.paramsDefault201(adminParams.token),
			)
		).json.id

		const enviada = await postUploadPhoto(
			personId,
			writeJpeg("foto-para-remover.jpg", peopleC14.photoBytes),
			peopleC14.paramsDefault201(adminParams.token),
		)

		assertTs.exists(
			enviada.json.photoUrl,
			"A foto de arranjo não foi aceita, então não há o que remover.",
		)
	})

	it("[C-14-F] - Limpar photoKey remove a foto e zera a URL pública", async () => {
		const { json } = await patchUpdatePerson(
			personId,
			{ name: personName, photoKey: null },
			peopleC14.paramsDefault200(adminParams.token),
		)

		assertTs.isNull(
			json.photoUrl,
			"A URL da foto continua preenchida depois de limpar a photoKey.",
		)
	})
})
