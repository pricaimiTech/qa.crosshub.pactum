import { assertTs, authBusiness, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import type { ITenantListItem } from "@core/interfaces/tenants/ITenants.interface"
import getListTenants from "@core/services/tenants/getListTenants.service"
import getPublicTenant from "@core/services/public/getPublicTenant.service"
import patchUpdateTenant from "@core/services/tenants/patchUpdateTenant.service"
import postTenantLogin from "@core/services/auth/postTenantLogin.service"
import { tenantFor } from "@core/utils/tenant.utils"
import { tenantsCLI01 } from "@tenants-data/tenants.data"

/**
 * `API-CLI-01` — implantação e suspensão são estados diferentes.
 *
 * Até a issue 143 a organização só tinha `active` e `inactive`, e o assistente
 * gravava a implantação como `inactive`. A lista de Clientes então carimbava
 * "Suspenso" em cliente recém-criado e o somava ao cartão "Suspensos · Requer
 * atenção". O que este caso prova é a regra por trás daquele selo: cada estado
 * abre um conjunto diferente de portas.
 */
describe(describeName.admin, () => {
	const tenant = tenantFor(tenantsCLI01.caseId)
	let platformParams: IParamsDefault

	before("Admin da plataforma e tenant reservado em estado conhecido", async () => {
		platformParams = await authBusiness.loginAsPlatformAdmin(
			`${process.env.ADMIN_EMAIL}`,
			`${process.env.ADMIN_PASSWORD}`,
			tenantsCLI01.loginParams,
		)

		await patchUpdateTenant(
			tenant.tenantId,
			{ status: tenantsCLI01.active },
			tenantsCLI01.paramsDefault200(platformParams.token),
		)
	})

	after("Devolve o tenant reservado para ativo", async () => {
		await patchUpdateTenant(
			tenant.tenantId,
			{ status: tenantsCLI01.active },
			tenantsCLI01.paramsDefault200(platformParams.token),
		)
	})

	it("[CLI-01-F] - Implantação é um status próprio: entra no Dashboard, não aparece no app público e não se confunde com suspensão", async () => {
		const emImplantacao = await patchUpdateTenant(
			tenant.tenantId,
			{ status: tenantsCLI01.onboarding },
			tenantsCLI01.paramsDefault200(platformParams.token),
		)

		assertTs.equal(
			emImplantacao.json.status,
			tenantsCLI01.onboarding,
			"A organização não ficou em implantação depois do PATCH.",
		)

		// A lista de Clientes lê daqui: enquanto os dois estados dividiam
		// `inactive`, o Admin não tinha como distinguir um do outro.
		const lista = await getListTenants(
			tenantsCLI01.paramsDefault200(platformParams.token),
		)
		const registro = (lista.json as Array<ITenantListItem>).filter(
			(item) => item.id === tenant.tenantId,
		)

		assertTs.equal(
			registro.length,
			1,
			"A organização reservada ao caso não apareceu na listagem do Super Admin.",
		)
		assertTs.equal(
			registro[0].status,
			tenantsCLI01.onboarding,
			"A listagem não devolveu o status de implantação.",
		)

		// Implantação existe para o cliente configurar marca e catálogo antes de ativar.
		const login = await postTenantLogin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			tenantsCLI01.paramsDefault200(),
		)

		assertTs.exists(
			login.json.accessToken,
			"O administrador de uma organização em implantação não conseguiu entrar no Dashboard.",
		)

		// O app público, esse só existe depois da ativação.
		const publico = await getPublicTenant(
			tenant.slug,
			tenantsCLI01.paramsDefault404(),
		)

		assertTs.equal(
			publico.json.message,
			tenantsCLI01.notFoundMessage,
			"A organização em implantação não devolveu a mensagem esperada na consulta pública.",
		)
	})

	it("[CLI-01-F] - Suspensão fecha o Dashboard, e a ativação reabre os dois acessos", async () => {
		await patchUpdateTenant(
			tenant.tenantId,
			{ status: tenantsCLI01.suspended },
			tenantsCLI01.paramsDefault200(platformParams.token),
		)

		const bloqueado = await postTenantLogin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			tenantsCLI01.paramsDefault401(),
		)

		assertTs.equal(
			bloqueado.json.message,
			tenantsCLI01.unauthorizedMessage,
			"A organização suspensa não devolveu a mensagem esperada no login do Dashboard.",
		)

		await patchUpdateTenant(
			tenant.tenantId,
			{ status: tenantsCLI01.active },
			tenantsCLI01.paramsDefault200(platformParams.token),
		)

		const reaberto = await postTenantLogin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			tenantsCLI01.paramsDefault200(),
		)

		assertTs.exists(
			reaberto.json.accessToken,
			"Ativar a organização não devolveu o acesso ao Dashboard.",
		)

		const publico = await getPublicTenant(
			tenant.slug,
			tenantsCLI01.paramsDefault200(),
		)

		assertTs.equal(
			publico.json.slug,
			tenant.slug,
			"A organização ativa não voltou a responder na consulta pública.",
		)
	})

	it("[CLI-01-F] - O contrato aceita só os três estados; o `setup` do assistente continua fora", async () => {
		const resposta = await patchUpdateTenant(
			tenant.tenantId,
			{ status: tenantsCLI01.invalidStatus as never },
			tenantsCLI01.paramsDefault400(platformParams.token),
		)

		assertTs.include(
			resposta.json.message,
			tenantsCLI01.invalidStatusMessage,
			"O contrato aceitou um status fora do enum da organização.",
		)
	})
})
