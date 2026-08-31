import {
	assertTs,
	authBusiness,
	describeName,
	groupBuilder,
	groupsBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import { groupsG02 } from "@groups-data/groups.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			groupsG02.loginParams,
		)
	})

	it("[G-02-F] - Grupo manual sem nenhuma pessoa é recusado", async () => {
		const mensagens = await groupsBusiness.rejectedGroups(
			[groupBuilder.withName(groupsG02.casePrefix).withPeople([]).build()],
			groupsG02.paramsDefault400(adminParams.token),
		)

		assertTs.include(
			mensagens[0],
			groupsG02.errorMessage,
			"A criação sem pessoas não trouxe a mensagem especificada.",
		)
	})
})
