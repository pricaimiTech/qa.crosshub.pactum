import "./env"
import { assert } from "chai"
import { spec } from "pactum"
import type Spec from "pactum/src/models/Spec"
import AppointmentsBusiness from "./business/appointments/appointments.business"
import AuthBusiness from "./business/auth/auth.business"
import FormsBusiness from "./business/forms/forms.business"
import BannersBusiness from "./business/banners/banners.business"
import BrandingBusiness from "./business/branding/branding.business"
import CatalogBusiness from "./business/catalog/catalog.business"
import GroupsBusiness from "./business/groups/groups.business"
import PeopleBusiness from "./business/people/people.business"
import PrivacyBusiness from "./business/privacy/privacy.business"
import AvailabilityDataBuilder from "./dataBuilder/appointments/availability.dataBuilder"
import PackageDataBuilder from "./dataBuilder/appointments/package.dataBuilder"
import ProfessionalDataBuilder from "./dataBuilder/appointments/professional.dataBuilder"
import ServiceDataBuilder from "./dataBuilder/appointments/service.dataBuilder"
import ServiceProfessionalLinkDataBuilder from "./dataBuilder/appointments/serviceProfessionalLink.dataBuilder"
import FormDataBuilder from "./dataBuilder/forms/form.dataBuilder"
import QuestionsDataBuilder from "./dataBuilder/forms/questions.dataBuilder"
import BannerDataBuilder from "./dataBuilder/banners/banner.dataBuilder"
import BrandingDataBuilder from "./dataBuilder/branding/branding.dataBuilder"
import CategoryDataBuilder from "./dataBuilder/catalog/category.dataBuilder"
import ProductDataBuilder from "./dataBuilder/catalog/product.dataBuilder"
import GroupDataBuilder from "./dataBuilder/groups/group.dataBuilder"
import PersonDataBuilder from "./dataBuilder/people/person.dataBuilder"
import type { IParamsDefault } from "./interface/global.interface"

/**
 * Tempo máximo de cada requisição. O default do Pactum (3 s) derruba consultas
 * pesadas quando a suíte roda em paralelo — e a falha aparece como erro de
 * negócio, não como timeout.
 */
const requestTimeoutMs = 15000

/**
 * Spec base do Pactum, com log condicionado à env `LOG`.
 * Todo service deve partir daqui em vez de chamar `spec()` direto.
 */
export function specPactumJs(): Spec {
	const pactumSpec = spec().withRequestTimeout(requestTimeoutMs)

	if (process.env.LOG === "true") {
		pactumSpec.inspect()
	}

	return pactumSpec
}

/** Asserções usadas nos testes — sempre com mensagem descritiva em português. */
export const assertTs: typeof assert = assert

/** Nome do `describe` por área da aplicação. */
export const describeName = {
	admin: "Admin",
	dashboard: "Dashboard",
	public: "Público",
} as const

/** Estado compartilhado entre `preSetup` e testes (tokens, ids). */
export const storage: Record<string, unknown> = {}

/** Fábricas de `IParamsDefault` reutilizadas pelos arquivos `.data.ts`. */
export const preSetup = {
	/**
	 * `IParamsDefault` para cenários de sucesso (200).
	 * @param retryCount - Número de novas tentativas
	 * @param retryDelay - Intervalo entre tentativas, em ms
	 * @param token - Bearer token, quando a rota for autenticada
	 */
	preSetupParamsDefault200(
		retryCount: number,
		retryDelay: number,
		token?: string,
	): IParamsDefault {
		return preSetup.preSetupParamsDefault(200, retryCount, retryDelay, token)
	},

	/**
	 * `IParamsDefault` para qualquer status esperado (inclusive 4xx).
	 * @param statusCode - Status HTTP esperado
	 * @param retryCount - Número de novas tentativas
	 * @param retryDelay - Intervalo entre tentativas, em ms
	 * @param token - Bearer token, quando a rota for autenticada
	 * @param tenantSlug - Slug do tenant, quando a rota exigir
	 */
	preSetupParamsDefault(
		statusCode: number,
		retryCount: number,
		retryDelay: number,
		token?: string,
		tenantSlug?: string,
	): IParamsDefault {
		return {
			statusCode,
			retry: { count: retryCount, delay: retryDelay },
			token,
			tenantSlug,
		}
	},
}

/** Businesses instanciados, consumidos pelos testes via `@core/constants`. */
export const authBusiness = new AuthBusiness()
export const appointmentsBusiness = new AppointmentsBusiness()
export const peopleBusiness = new PeopleBusiness()
export const formsBusiness = new FormsBusiness()
export const privacyBusiness = new PrivacyBusiness()
export const groupsBusiness = new GroupsBusiness()
export const catalogBusiness = new CatalogBusiness()
export const brandingBusiness = new BrandingBusiness()
export const bannersBusiness = new BannersBusiness()

/** DataBuilders instanciados, consumidos pelos testes via `@core/constants`. */
export const serviceBuilder = new ServiceDataBuilder()
export const professionalBuilder = new ProfessionalDataBuilder()
export const serviceProfessionalLinkBuilder = new ServiceProfessionalLinkDataBuilder()
export const availabilityBuilder = new AvailabilityDataBuilder()
export const personBuilder = new PersonDataBuilder()
export const packageBuilder = new PackageDataBuilder()
export const formBuilder = new FormDataBuilder()
export const questionsBuilder = new QuestionsDataBuilder()
export const groupBuilder = new GroupDataBuilder()
export const bannerBuilder = new BannerDataBuilder()
export const brandingBuilder = new BrandingDataBuilder()
export const categoryBuilder = new CategoryDataBuilder()
export const productBuilder = new ProductDataBuilder()
