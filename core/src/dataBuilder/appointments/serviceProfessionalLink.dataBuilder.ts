import type { IServiceProfessionalLink } from "../../interface/appointments/IAppointments.interface"

/**
 * Vínculo serviço–profissional, item de `PUT .../services/{id}/professionals`.
 * O `professionalId` só existe depois de criar o profissional, então é
 * preenchido pelo business — o builder monta o resto do vínculo.
 */
export type IServiceProfessionalLinkDraft = Omit<
	IServiceProfessionalLink,
	"professionalId"
>

export default class ServiceProfessionalLinkDataBuilder {
	private linkData: IServiceProfessionalLinkDraft

	constructor() {
		this.linkData = ServiceProfessionalLinkDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): IServiceProfessionalLinkDraft {
		return {
			durationMinutes: 60,
			intervalMinutes: 0,
			capacity: 1,
		}
	}

	/**
	 * Define a duração do atendimento
	 * @param durationMinutes - Duração em minutos, mínimo 1
	 */
	withDurationMinutes(durationMinutes: number): ServiceProfessionalLinkDataBuilder {
		this.linkData.durationMinutes = durationMinutes
		return this
	}

	/**
	 * Define o intervalo reservado após o atendimento
	 * @param intervalMinutes - Intervalo em minutos, mínimo 0
	 */
	withIntervalMinutes(intervalMinutes: number): ServiceProfessionalLinkDataBuilder {
		this.linkData.intervalMinutes = intervalMinutes
		return this
	}

	/**
	 * Define quantos clientes cabem no mesmo horário
	 * @param capacity - Capacidade da janela, mínimo 1
	 */
	withCapacity(capacity: number): ServiceProfessionalLinkDataBuilder {
		this.linkData.capacity = capacity
		return this
	}

	/**
	 * Define o preço do atendimento com este profissional
	 * @param unitPriceCents - Preço em centavos
	 */
	withUnitPriceCents(unitPriceCents: number): ServiceProfessionalLinkDataBuilder {
		this.linkData.unitPriceCents = unitPriceCents
		return this
	}

	/** Constrói o payload final, sem o `professionalId` */
	build(): IServiceProfessionalLinkDraft {
		return this.linkData
	}
}
