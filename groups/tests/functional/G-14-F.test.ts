import {
	assertTs,
	authBusiness,
	describeName,
	formsBusiness,
	groupBuilder,
	groupsBusiness,
	personBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchUpdateGroup from "@core/services/groups/patchUpdateGroup.service"
import { groupsG14 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let groupId: string
	let groupName: string

	before("Grupo manual finalizado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG14.loginParams,
		)

		const people = await formsBusiness.createPeople(
			[
				personBuilder
					.withName(groupsG14.personPrefix)
					.withEmail(groupsG14.personPrefix)
					.build(),
			],
			adminParams,
		)

		const grupos = await groupsBusiness.createGroups(
			groupBuilder
				.withName(groupsG14.casePrefix)
				.withPeople(people)
				.build(),
			groupsG14.paramsDefault201(adminParams.token),
		)

		groupId = grupos[0].id
		groupName = grupos[0].name

		// A máquina de estados exige passar por active antes de finalizar.
		await patchUpdateGroup(
			groupId,
			{ name: groupName, status: "active" },
			groupsG14.paramsDefault200(adminParams.token),
		)
		await patchUpdateGroup(
			groupId,
			{ name: groupName, status: groupsG14.finalizedStatus },
			groupsG14.paramsDefault200(adminParams.token),
		)
	})

	it("[G-14-F] - Grupo finalizado não volta para rascunho: o PATCH tem a mesma máquina de estados da ativação", async () => {
		const { json } = await patchUpdateGroup(
			groupId,
			{ name: groupName, status: groupsG14.draftStatus },
			groupsG14.paramsDefault400(adminParams.token),
		)

		assertTs.equal(
			json.message,
			groupsG14.errorMessage,
			"A recusa da volta de finalized para draft não trouxe a mensagem especificada.",
		)

		// Ficar no mesmo status não é transição: editar o nome de um grupo
		// finalizado continua permitido.
		const renomeado = await patchUpdateGroup(
			groupId,
			{ name: `${groupName} renomeado`, status: groupsG14.finalizedStatus },
			groupsG14.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			renomeado.json.status,
			groupsG14.finalizedStatus,
			"O grupo finalizado mudou de status ao ser renomeado.",
		)
	})
})
