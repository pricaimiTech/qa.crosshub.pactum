import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getCalendar from "@core/services/appointments/getCalendar.service"
import { bugMessage, bugTag } from "@core/utils/bug.utils"
import { calendarAG28 } from "@appointments-data/calendar.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault

	before("Admin do tenant autenticado", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			calendarAG28.loginParams,
		)
	})

	it(`[AG-28-F]${bugTag(calendarAG28.knownBug)} - Feriados móveis aparecem com a data correta em dois anos distintos`, async () => {
		const first = await getCalendar(
			{ from: calendarAG28.years[0].from, to: calendarAG28.years[0].to },
			calendarAG28.paramsDefault200(adminParams.token),
		)
		const second = await getCalendar(
			{ from: calendarAG28.years[1].from, to: calendarAG28.years[1].to },
			calendarAG28.paramsDefault200(adminParams.token),
		)

		const returned = [...first.json.holidays, ...second.json.holidays].map(
			(holiday: { date: string; name: string }) => `${holiday.date} ${holiday.name}`,
		)

		const missing = [
			...calendarAG28.years[0].expected,
			...calendarAG28.years[1].expected,
		].filter((holiday) => !returned.includes(`${holiday.date} ${holiday.name}`))

		assertTs.deepEqual(
			missing,
			[],
			bugMessage(
				"Feriados móveis ausentes do calendário — a tabela parece ter só datas fixas.",
				calendarAG28.knownBug,
			),
		)
	})
})
