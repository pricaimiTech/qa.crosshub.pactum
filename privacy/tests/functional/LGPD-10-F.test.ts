import {
	assertTs,
	authBusiness,
	describeName,
	privacyBusiness,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import patchUpdateSettings from "@core/services/privacy/patchUpdateSettings.service"
import { privacyLGPD10 } from "@privacy-data/privacy.data"

describe(describeName.dashboard, () => {
	let primaryParams: IParamsDefault

	before("Administrador Principal autenticado", async () => {
		primaryParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			privacyLGPD10.loginParams,
		)
	})

	it("[LGPD-10-F] - Retenção só aceita inteiro entre 1 e 3650 dias", async () => {
		const mensagens = await privacyBusiness.rejectedRetentionDays(
			privacyLGPD10.invalidValues,
			privacyLGPD10.paramsDefault400(primaryParams.token),
		)

		const foraDoPadrao = mensagens.filter(
			(mensagem) => !mensagem.includes(privacyLGPD10.errorMessage),
		)

		assertTs.deepEqual(
			foraDoPadrao,
			[],
			"Alguma variação inválida de retenção não foi recusada com a mensagem especificada.",
		)

		const minimo = await patchUpdateSettings(
			{ sensitiveDataRetentionDays: privacyLGPD10.minimumValid },
			privacyLGPD10.paramsDefault200(primaryParams.token),
		)

		assertTs.equal(
			minimo.json.sensitiveDataRetentionDays,
			privacyLGPD10.minimumValid,
			"O limite inferior de 1 dia foi recusado.",
		)

		const maximo = await patchUpdateSettings(
			{ sensitiveDataRetentionDays: privacyLGPD10.maximumValid },
			privacyLGPD10.paramsDefault200(primaryParams.token),
		)

		assertTs.equal(
			maximo.json.sensitiveDataRetentionDays,
			privacyLGPD10.maximumValid,
			"O limite superior de 3650 dias foi recusado.",
		)

		// Devolve a política ao valor padrão, que os outros casos assumem.
		await patchUpdateSettings(
			{ sensitiveDataRetentionDays: privacyLGPD10.defaultValue },
			privacyLGPD10.paramsDefault200(primaryParams.token),
		)
	})

})
