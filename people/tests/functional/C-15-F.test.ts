import { assertTs, authBusiness, describeName, personBuilder } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getList from "@core/services/audit/getList.service"
import patchUpdatePerson from "@core/services/people/patchUpdatePerson.service"
import postCreateCode from "@core/services/people/postCreateCode.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import postRegenerateCode from "@core/services/people/postRegenerateCode.service"
import postRemoveAccess from "@core/services/people/postRemoveAccess.service"
import { peopleC15 } from "@people-data/people.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string

	before("Pessoa criada, editada, com código gerado, regenerado e acesso removido", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			peopleC15.loginParams,
		)

		const person = personBuilder.withName(peopleC15.casePrefix).withEmail("c15").build()
		const created = await postCreatePerson(person, peopleC15.paramsDefault201(adminParams.token))
		personId = created.json.id

		await patchUpdatePerson(
			personId,
			{ name: `${person.name} editada`, email: person.email },
			peopleC15.paramsDefault200(adminParams.token),
		)
		await postCreateCode(personId, peopleC15.paramsDefault201(adminParams.token))
		await postRegenerateCode(personId, peopleC15.paramsDefault201(adminParams.token))
		await postRemoveAccess(personId, peopleC15.paramsDefault201(adminParams.token))
	})

	it("[C-15-F] - Cada ação sobre a pessoa deixa o seu evento na trilha de auditoria", async () => {
		const { json } = await getList(
			{ pageSize: 100 },
			peopleC15.paramsDefault200(adminParams.token),
		)

		const daPessoa = json.items.filter(
			(registro: { entityId: string | null; metadata: Record<string, unknown> }) =>
				registro.entityId === personId ||
				JSON.stringify(registro.metadata).includes(personId),
		)

		const acoes = new Set(daPessoa.map((registro: { action: string }) => registro.action))

		const faltando = peopleC15.expectedActions.filter((action) => !acoes.has(action))

		assertTs.deepEqual(
			faltando,
			[],
			`Ações sem evento na trilha para a pessoa ${personId}: ${faltando.join(", ")}.`,
		)
	})
})
