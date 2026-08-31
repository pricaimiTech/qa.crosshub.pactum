import { faker } from "@faker-js/faker"
import type { ISaveBranding } from "../../interface/branding/IBranding.interface"

/**
 * Payload de `PUT /dashboard/branding`.
 *
 * Todos os campos obrigatórios já vêm preenchidos: a rota é um upsert de linha
 * única e recusa payload parcial, então o default precisa ser um estado válido.
 */
export default class BrandingDataBuilder {
	private brandingData: ISaveBranding

	constructor() {
		this.brandingData = BrandingDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ISaveBranding {
		return {
			displayName: `[QA] Marca ${faker.string.alphanumeric(8)}`,
			slogan: "",
			description: "",
			accentColor: "#0B1F33",
			themeMode: "light",
		}
	}

	/**
	 * Define o nome exibido da marca
	 * @param displayName - Prefixo do nome, normalmente o ID do caso de teste
	 */
	withDisplayName(displayName: string): BrandingDataBuilder {
		this.brandingData.displayName = `${displayName} ${faker.string.alphanumeric(8)}`
		return this
	}

	/**
	 * Define a cor de destaque, semente do tema derivado
	 * @param accentColor - Cor em hexadecimal `#RRGGBB`
	 */
	withAccentColor(accentColor: string): BrandingDataBuilder {
		this.brandingData.accentColor = accentColor
		return this
	}

	/**
	 * Define o modo do tema
	 * @param themeMode - `dark` ou `light`
	 */
	withThemeMode(themeMode: "dark" | "light"): BrandingDataBuilder {
		this.brandingData.themeMode = themeMode
		return this
	}

	/**
	 * Vincula a logo enviada pelo upload
	 * @param logoKey - Chave devolvida pelo upload, ou `null` para remover
	 */
	withLogoKey(logoKey: string | null): BrandingDataBuilder {
		this.brandingData.logoKey = logoKey as string
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**, porque o Mocha em
	 * paralelo roda vários arquivos de teste no mesmo processo.
	 */
	build(): ISaveBranding {
		const payload = structuredClone(this.brandingData)
		this.brandingData = BrandingDataBuilder.defaults()

		return payload
	}
}
