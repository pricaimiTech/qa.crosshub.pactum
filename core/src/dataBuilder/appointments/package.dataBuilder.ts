import { faker } from "@faker-js/faker"
import type { ICreatePackage } from "../../interface/appointments/IAppointments.interface"

/** Payload de `POST /dashboard/appointments/packages`. */
export default class PackageDataBuilder {
	private packageData: ICreatePackage

	constructor() {
		this.packageData = PackageDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICreatePackage {
		return {
			name: `[QA] Pacote ${faker.string.alphanumeric(8)}`,
			priceCents: 30000,
			totalCredits: 10,
			validityDays: 90,
			services: [],
		}
	}

	/**
	 * Define o nome do pacote, sufixado para não colidir entre execuções.
	 * Nome repetido no mesmo tenant derruba a API com 500 (issue #89).
	 * @param name - Prefixo do nome, normalmente o ID do caso de teste
	 */
	withName(name: string): PackageDataBuilder {
		this.packageData.name = `${name} ${faker.string.alphanumeric(8)}`
		return this
	}

	/**
	 * Define preço e quantidade de créditos do pacote
	 * @param priceCents - Preço em centavos
	 * @param totalCredits - Créditos concedidos na venda
	 */
	withCredits(priceCents: number, totalCredits: number): PackageDataBuilder {
		this.packageData.priceCents = priceCents
		this.packageData.totalCredits = totalCredits
		return this
	}

	/**
	 * Define quais serviços o pacote cobre
	 * @param serviceId - Serviço coberto
	 * @param creditsPerSession - Créditos consumidos por sessão
	 */
	withService(serviceId: string, creditsPerSession: number): PackageDataBuilder {
		this.packageData.services = [{ serviceId, creditsPerSession }]
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**.
	 *
	 * O builder é instanciado uma vez em `@core/constants` e reaproveitado — e o
	 * Mocha em paralelo roda vários arquivos de teste no mesmo processo. Sem o
	 * reset, um `with...()` de um caso vaza para o caso seguinte do mesmo worker,
	 * e o teste falha por uma configuração que ele nunca pediu.
	 */
	build(): ICreatePackage {
		const payload = structuredClone(this.packageData)
		this.packageData = PackageDataBuilder.defaults()

		return payload
	}
}
