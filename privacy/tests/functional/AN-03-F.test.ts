import {
	assertTs,
	authBusiness,
	describeName,
	formBuilder,
	formsBusiness,
	peopleBusiness,
	personBuilder,
	questionsBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListFormAssignments from "@core/services/people/getListFormAssignments.service"
import getListPeople from "@core/services/people/getListPeople.service"
import postRemoveAccess from "@core/services/people/postRemoveAccess.service"
import { anonymizationAN03 } from "@privacy-data/anonymization.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string
	let cadastroAntes: Record<string, unknown>

	before("Pessoa com conta ativa, formulário respondido e atribuição", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			anonymizationAN03.loginParams,
		)

		await formsBusiness.cleanupByPrefix(
			anonymizationAN03.casePrefix,
			adminParams,
		)

		// Pessoa descartável: o caso revoga o acesso dela no final.
		const client = await peopleBusiness.createActivatedPerson(
			personBuilder
				.withName(anonymizationAN03.casePrefix)
				.withEmail(anonymizationAN03.casePrefix)
				.build(),
			`${process.env.TENANT_SLUG}`,
			anonymizationAN03.pin,
			adminParams,
		)

		personId = client.personId

		await formsBusiness.createAnsweredSensitiveForm(
			formBuilder.withTitle(anonymizationAN03.casePrefix).build(),
			questionsBuilder.reset().withShortText().build(),
			client,
			`${process.env.TENANT_SLUG}`,
			anonymizationAN03.answer,
			adminParams,
		)

		const pessoas = await getListPeople(
			anonymizationAN03.paramsDefault200(adminParams.token),
		)

		cadastroAntes = pessoas.json.filter(
			(pessoa: { id: string }) => pessoa.id === personId,
		)[0]
	})

	it("[AN-03-F] - Remover acesso revoga a conta e preserva cadastro e histórico", async () => {
		await postRemoveAccess(
			personId,
			anonymizationAN03.paramsDefault201(adminParams.token),
		)

		const pessoas = await getListPeople(
			anonymizationAN03.paramsDefault200(adminParams.token),
		)

		const cadastroDepois = pessoas.json.filter(
			(pessoa: { id: string }) => pessoa.id === personId,
		)[0]

		assertTs.exists(
			cadastroDepois,
			"A pessoa sumiu da listagem: remover acesso apagou o cadastro, quando deveria só revogar.",
		)

		assertTs.equal(
			cadastroDepois.status,
			anonymizationAN03.expectedStatus,
			"A pessoa não ficou com status revoked.",
		)

		const apagados = anonymizationAN03.preservedFields.filter(
			(campo) => cadastroDepois[campo] !== cadastroAntes[campo],
		)

		assertTs.deepEqual(
			apagados,
			[],
			"Algum dado pessoal foi alterado pela revogação. Remover acesso não é anonimizar: o cadastro permanece como estava.",
		)

		// O histórico de formulários também continua ligado à pessoa.
		const atribuicoes = await getListFormAssignments(
			personId,
			anonymizationAN03.paramsDefault200(adminParams.token),
		)

		assertTs.isAbove(
			atribuicoes.json.length,
			0,
			"O histórico de formulários da pessoa sumiu com a revogação.",
		)
	})
})
