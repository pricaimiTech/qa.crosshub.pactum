import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getAnalytics from "@core/services/appointments/getAnalytics.service"
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { calendarAG30 } from "@appointments-data/calendar.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Tenant sem o add-on de indicadores", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			calendarAG30.loginParams,
		)
	})

	it(`[AG-30-F]${bugTag(calendarAG30.knownBug)} - Indicadores sem o add-on ativo são recusados com a mensagem do gate`, async () => {
		const { json } = await getAnalytics(
			{},
			calendarAG30.paramsDefault400(adminParams.token),
		)

		assertTs.equal(
			json.message,
			calendarAG30.errorMessage,
			bugMessage(
				"O gate do add-on não recusou a consulta com 400 e a mensagem especificada.",
				calendarAG30.knownBug,
			),
		)
	})
})
