import {
	assertTs,
	authBusiness,
	describeName,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import postUploadPhoto from "@core/services/people/postUploadPhoto.service"
import { writeJpeg, writePdf } from "@core/utils/file.utils"
import { peopleC13 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string

	before("Pessoa cadastrada, sem foto", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC13.loginParams,
		)

		personId = (
			await postCreatePerson(
				personBuilder
					.withName(peopleC13.casePrefix)
					.withEmail(peopleC13.casePrefix)
					.build(),
				peopleC13.paramsDefault201(adminParams.token),
			)
		).json.id
	})

	it("[C-13-F] - PDF e imagem acima de 5 MB são recusados; JPEG dentro do limite é aceito", async () => {
		const pdf = await postUploadPhoto(
			personId,
			writePdf("foto.pdf"),
			peopleC13.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			JSON.stringify(pdf.json.message),
			peopleC13.errorMessage,
			"O PDF não foi recusado com a mensagem especificada.",
		)

		await postUploadPhoto(
			personId,
			writeJpeg("foto-grande.jpg", peopleC13.oversizedBytes),
			peopleC13.paramsDefault413(adminParams.token),
		)

		const aceito = await postUploadPhoto(
			personId,
			writeJpeg("foto-valida.jpg", peopleC13.acceptedBytes),
			peopleC13.paramsDefault201(adminParams.token),
		)

		assertTs.exists(
			aceito.json.photoUrl,
			"O upload aceito não devolveu a URL pública da foto.",
		)

		assertTs.notInclude(
			JSON.stringify(aceito.json),
			"base64",
			"A resposta do upload traz a imagem embutida em vez de uma URL.",
		)
	})
})
