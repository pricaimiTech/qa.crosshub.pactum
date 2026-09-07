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
	dashboardAnalytics: "/dashboard/analytics",
	dashboardAppointments: "/dashboard/appointments",
	dashboardBanners: "/dashboard/banners",
	dashboardBranding: "/dashboard/branding",
	dashboardCategories: "/dashboard/categories",
	dashboardForms: "/dashboard/forms",
	dashboardGroups: "/dashboard/groups",
	dashboardPeople: "/dashboard/people",
	dashboardPrivacy: "/dashboard/privacy",
	dashboardProducts: "/dashboard/products",
	dashboardReservations: "/dashboard/reservations",

	// Área pública / usuário final
	public: "/public",
	publicAppointments: "/public/appointments",
	publicForms: "/public/forms",
	publicMe: "/public/me",
	publicProducts: "/public/products",
	publicTenants: "/public/tenants",

	// Infra
	assets: "/assets",
	health: "/health",
} as const

export type ApiName = keyof typeof apiName
