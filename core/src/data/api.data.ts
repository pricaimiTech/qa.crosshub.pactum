/**
 * Prefixos reais das rotas da API do CrossHub (`apps/api/src/**.controller.ts`).
 * Não há prefixo global no Nest — as rotas começam direto nestes caminhos.
 * Usar sempre `${process.env.BASE_URL}${apiName.<chave>}/...` nos services.
 */
export const apiName = {
	// Autenticação
	authPlatform: "/auth/platform",

	// Área do super admin da plataforma
	adminAddOns: "/admin/add-ons",
	adminBilling: "/admin/billing",
	adminPlans: "/admin/plans",
	adminTenants: "/admin/tenants",

	// Área logada do tenant (dashboard)
	dashboard: "/dashboard",
	dashboardAppointments: "/dashboard/appointments",
	dashboardBanners: "/dashboard/banners",
	dashboardBranding: "/dashboard/branding",
	dashboardForms: "/dashboard/forms",
	dashboardGroups: "/dashboard/groups",
	dashboardPeople: "/dashboard/people",
	dashboardPrivacy: "/dashboard/privacy",

	// Área pública / usuário final
	public: "/public",
	publicTenants: "/public/tenants",

	// Infra
	assets: "/assets",
	health: "/health",
} as const

export type ApiName = keyof typeof apiName
