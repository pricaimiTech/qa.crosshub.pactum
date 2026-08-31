import { faker } from "@faker-js/faker"
import type { ICreateService } from "../../interface/appointments/IAppointments.interface"

/** Payload de `POST /dashboard/appointments/services`. */
export default class ServiceDataBuilder {
	private serviceData: ICreateService

	constructor() {
		this.serviceData = ServiceDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICreateService {
		return {
			name: `[QA] Serviço ${faker.string.alphanumeric(8)}`,
			description: "",
			approvalMode: "manual",
			professionalSelectionMode: "automatic",
			unitPriceCents: 0,
			isActive: true,
		}
	}

	/**
	 * Define o nome do serviço, sufixado para não colidir entre execuções
	 * @param name - Prefixo do nome, normalmente o ID do caso de teste
	 */
	withName(name: string): ServiceDataBuilder {
		this.serviceData.name = `${name} ${faker.string.alphanumeric(8)}`
		return this
	}

	/**
	 * Define se o agendamento nasce `pending` (manual) ou `approved` (automatic)
	 * @param approvalMode - Modo de aprovação do serviço
	 */
	withApprovalMode(approvalMode: "manual" | "automatic"): ServiceDataBuilder {
		this.serviceData.approvalMode = approvalMode
		return this
	}

	/**
	 * Define como o cliente escolhe o profissional ao agendar
	 * @param mode - `automatic`, `optional` ou `required`
	 */
	withProfessionalSelectionMode(
		mode: "automatic" | "optional" | "required",
	): ServiceDataBuilder {
		this.serviceData.professionalSelectionMode = mode
		return this
	}

	/**
	 * Define o preço base do serviço
	 * @param unitPriceCents - Preço em centavos
	 */
	withUnitPriceCents(unitPriceCents: number): ServiceDataBuilder {
		this.serviceData.unitPriceCents = unitPriceCents
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
	build(): ICreateService {
		const payload = structuredClone(this.serviceData)
		this.serviceData = ServiceDataBuilder.defaults()

		return payload
	}
}
