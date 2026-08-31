import { preSetup } from "@core/constants"
import { weekdayOfDate } from "@core/utils/date.utils"
import { dateForCase } from "@shared-data/testDates.data"

/** Login responde 201, não 200 — divergência aberta na issue #86. */
const loginParams = preSetup.preSetupParamsDefault(201, 5, 500)

/**
 * `API-AG-XT` — isolamento entre tenants.
 *
 * O tenant B é criado uma única vez pelo `preSetup`; o teste só cria massa
 * dentro dele e confere que ela nunca aparece para o tenant A.
 */
export const isolationAGXT = {
	casePrefix: "[AG-XT]",
	date: dateForCase("AG-XT"),
	weekday: weekdayOfDate(dateForCase("AG-XT")),
	startTime: "08:00",
	endTime: "12:00",
	durationMinutes: 60,
	capacity: 5,
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault404: (token?: string) =>
		preSetup.preSetupParamsDefault(404, 5, 500, token),
}
