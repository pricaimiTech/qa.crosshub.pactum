import { assertTs, preSetup } from "../../constants"
import AuthBusiness from "../auth/auth.business"
import type { IServiceProfessionalLinkDraft } from "../../dataBuilder/appointments/serviceProfessionalLink.dataBuilder"
import type { ICreatePerson } from "../../interface/people/IPeople.interface"
import type {
	ICreateProfessional,
	ICreateService,
	IRescheduleAppointment,
	ISaveAvailability,
	IServiceProfessionalLink,
	IUpdateAppointmentStatus,
} from "../../interface/appointments/IAppointments.interface"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IPooledEndUser } from "../../utils/endUser.utils"
import { timeInTenantTimezone } from "../../utils/date.utils"
import deleteProfessional from "../../services/appointments/deleteProfessional.service"
import deleteService from "../../services/appointments/deleteService.service"
import getProfessionals from "../../services/appointments/getProfessionals.service"
import getAvailability from "../../services/appointments/getAvailability.service"
import getListAppointments from "../../services/appointments/getListAppointments.service"
import patchUpdateAppointmentStatus from "../../services/appointments/patchUpdateAppointmentStatus.service"
import postPublicCreateAppointment from "../../services/public/postPublicCreateAppointment.service"
import postPublicCreateAppointmentRace from "../../services/public/postPublicCreateAppointmentRace.service"
import getPublicAvailability from "../../services/public/getPublicAvailability.service"
import getServices from "../../services/appointments/getServices.service"
import postCreateAppointment from "../../services/appointments/postCreateAppointment.service"
import postCreatePerson from "../../services/people/postCreatePerson.service"
import postCreateProfessional from "../../services/appointments/postCreateProfessional.service"
import postRescheduleAppointment from "../../services/appointments/postRescheduleAppointment.service"
import postCreateService from "../../services/appointments/postCreateService.service"
import putSaveProfessionalAvailability from "../../services/appointments/putSaveProfessionalAvailability.service"
import putSetProfessionals from "../../services/appointments/putSetProfessionals.service"

/** Cenário pronto para os casos que só precisam de um agendamento existente. */
export interface IExistingAppointment extends IBookableService {
	personId: string
	appointmentId: string
	startsAt: string
	endsAt: string
}

/** Serviço agendável já montado: serviço + profissional + vínculo + agenda. */
export interface IBookableService {
	serviceId: string
	professionalId: string
}

/** Janela devolvida pela disponibilidade, pública ou do admin. */
export interface IAvailabilitySlotResponse {
	professionalId: string
	startsAt: string
	endsAt: string
	occupied: number
	capacity: number
}

/** Agendamento devolvido pela listagem do dashboard. */
interface IAppointmentSummary {
	id: string
	personId: string
	status: string
}

/** Item devolvido pelas listagens de serviço e profissional. */
interface INamedResource {
	id: string
	name: string
}

export default class AppointmentsBusiness {
	/**
	 * Monta um serviço pronto para agendamento: cria o profissional, cria o
	 * serviço, vincula os dois com duração/intervalo/capacidade e grava a
	 * disponibilidade do profissional.
	 * @param service - Payload do serviço, vindo do `ServiceDataBuilder`
	 * @param professional - Payload do profissional, vindo do `ProfessionalDataBuilder`
	 * @param link - Vínculo serviço–profissional, sem o `professionalId`
	 * @param availability - Regras de disponibilidade do profissional
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Ids do serviço e do profissional criados
	 */
	public async createBookableService(
		service: ICreateService,
		professional: ICreateProfessional,
		link: IServiceProfessionalLinkDraft,
		availability: ISaveAvailability,
		paramsDefault: IParamsDefault,
	): Promise<IBookableService> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)
		const updated200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const professionalResponse = await postCreateProfessional(
			professional,
			created201,
		)
		const serviceResponse = await postCreateService(service, created201)

		const professionalId: string = professionalResponse.json.id
		const serviceId: string = serviceResponse.json.id

		await putSetProfessionals(
			serviceId,
			{ professionals: [{ ...link, professionalId }] },
			updated200,
		)
		await putSaveProfessionalAvailability(
			professionalId,
			availability,
			updated200,
		)

		return { serviceId, professionalId }
	}

	/**
	 * Apaga serviços e profissionais deixados por execuções anteriores do mesmo
	 * caso. O prefixo é o ID do caso (ex.: `[AG-01]`), então a limpeza nunca
	 * alcança a massa de outro teste rodando em paralelo.
	 *
	 * Recursos com histórico respondem 409 e são ignorados de propósito — o
	 * objetivo é não acumular lixo, não garantir base vazia.
	 * @param prefix - Prefixo do nome dos recursos do caso
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 */
	public async cleanupByPrefix(
		prefix: string,
		paramsDefault: IParamsDefault,
	): Promise<void> {
		const read200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)
		const anyStatus = preSetup.preSetupParamsDefault(
			200,
			0,
			0,
			paramsDefault.token,
		)

		const services: Array<INamedResource> = (await getServices(read200)).json
		const professionals: Array<INamedResource> = (
			await getProfessionals(read200)
		).json

		for (const service of services.filter((item) =>
			item.name.startsWith(prefix),
		)) {
			await deleteService(service.id, anyStatus).catch(() => undefined)
		}

		for (const professional of professionals.filter((item) =>
			item.name.startsWith(prefix),
		)) {
			await deleteProfessional(professional.id, anyStatus).catch(
				() => undefined,
			)
		}
	}

	/**
	 * Primeira janela livre que o **admin** enxerga para um serviço em uma data.
	 *
	 * Diferente da rota pública, esta devolve o array de janelas direto, sem o
	 * envelope `{ slots }` que o contrato declara (issue #86).
	 * @param serviceId - Id do serviço consultado
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns A primeira janela com vaga disponível
	 */
	public async firstAdminSlot(
		serviceId: string,
		date: string,
		paramsDefault: IParamsDefault,
	): Promise<IAvailabilitySlotResponse> {
		const response = await getAvailability({ serviceId, date }, paramsDefault)
		const slots: Array<IAvailabilitySlotResponse> = response.json

		const available = slots.filter((slot) => slot.occupied < slot.capacity)

		assertTs.isAbove(
			available.length,
			0,
			`Nenhuma janela livre no painel para o serviço ${serviceId} em ${date}.`,
		)

		return available[0]
	}

	/**
	 * Primeira janela livre que o cliente enxerga para um serviço em uma data.
	 * É a origem do `startsAt` de todo agendamento feito pelo app — inventar o
	 * horário na mão faz o teste falhar por motivo errado.
	 * @param serviceId - Id do serviço consultado
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param paramsDefault - Parâmetros padrão já autenticados como cliente final
	 * @returns A primeira janela com vaga disponível
	 */
	public async firstPublicSlot(
		serviceId: string,
		date: string,
		paramsDefault: IParamsDefault,
	): Promise<IAvailabilitySlotResponse> {
		const response = await getPublicAvailability({ serviceId, date }, paramsDefault)
		const slots: Array<IAvailabilitySlotResponse> = response.json.slots

		const available = slots.filter((slot) => slot.occupied < slot.capacity)

		assertTs.isAbove(
			available.length,
			0,
			`Nenhuma janela livre para o serviço ${serviceId} em ${date}.`,
		)

		return available[0]
	}

	/**
	 * Cancela, como admin, os agendamentos ativos de uma pessoa em um intervalo.
	 *
	 * A cota de um agendamento por dia do cliente conta `pending` e `approved`,
	 * então sem esta limpeza a segunda execução do mesmo caso no mesmo dia
	 * esbarraria na massa que a primeira deixou. Cancelados não ocupam cota —
	 * é exatamente o que `AG-08` prova.
	 * @param personId - Pessoa cujos agendamentos serão cancelados
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param reason - Motivo registrado no cancelamento
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 */
	public async cancelAppointmentsOfPerson(
		personId: string,
		date: string,
		reason: string,
		paramsDefault: IParamsDefault,
	): Promise<void> {
		const read200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const response = await getListAppointments(
			{ from: date, to: date },
			read200,
		)
		const appointments: Array<IAppointmentSummary> = response.json

		const active = appointments.filter(
			(appointment) =>
				appointment.personId === personId &&
				["pending", "approved"].includes(appointment.status),
		)

		for (const appointment of active) {
			// Sem `catch`: uma limpeza que falha em silêncio deixa massa ativa e
			// derruba o caso seguinte com um 409 de cota diária, longe da causa.
			await patchUpdateAppointmentStatus(
				appointment.id,
				{ status: "cancelled_by_admin", reason },
				read200,
			)
		}
	}

	/**
	 * Ocupa uma janela com vários clientes distintos, um agendamento por cliente.
	 *
	 * A cota de um agendamento por dia impede usar o mesmo cliente duas vezes,
	 * então lotar uma janela de capacidade N exige N clientes do pool.
	 * @param clients - Clientes do pool que farão as reservas
	 * @param slug - Slug do tenant
	 * @param serviceId - Serviço a agendar
	 * @param startsAt - Início da janela, em ISO 8601
	 * @param paramsDefault - Parâmetros padrão base (o token de cada cliente é obtido aqui)
	 * @returns Ids dos agendamentos criados, na ordem dos clientes
	 */
	public async fillSlotWithClients(
		clients: Array<IPooledEndUser>,
		slug: string,
		serviceId: string,
		startsAt: string,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const authBusiness = new AuthBusiness()
		const loginParams = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
		)
		const created201 = (token?: string) =>
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				token,
			)

		const ids: Array<string> = []

		for (const client of clients) {
			const clientParams = await authBusiness.loginAsEndUser(
				slug,
				client.email,
				client.password,
				loginParams,
			)

			const response = await postPublicCreateAppointment(
				{ serviceId, startsAt },
				created201(clientParams.token),
			)

			ids.push(response.json.id)
		}

		return ids
	}

	/**
	 * Cancela os agendamentos ativos de vários clientes na mesma data.
	 * @param clients - Clientes do pool cuja massa será limpa
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param reason - Motivo registrado no cancelamento
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 */
	public async cancelAppointmentsOfClients(
		clients: Array<IPooledEndUser>,
		date: string,
		reason: string,
		paramsDefault: IParamsDefault,
	): Promise<void> {
		for (const client of clients) {
			await this.cancelAppointmentsOfPerson(
				client.personId,
				date,
				reason,
				paramsDefault,
			)
		}
	}

	/**
	 * Diz se uma janela está lotada na agenda do admin.
	 *
	 * A especificação (`AG-17`) aceita as duas formas de sinalizar lotação: a
	 * janela **some** da lista ou volta com `occupied == capacity`. A condicional
	 * mora aqui porque os arquivos de teste não podem ter `if`.
	 * @param serviceId - Id do serviço consultado
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param startsAt - Início da janela, em ISO 8601
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns `true` quando a janela não aceita mais reservas
	 */
	public async isSlotFull(
		serviceId: string,
		date: string,
		startsAt: string,
		paramsDefault: IParamsDefault,
	): Promise<boolean> {
		const response = await getAvailability({ serviceId, date }, paramsDefault)
		const slots: Array<IAvailabilitySlotResponse> = response.json

		const found = slots.filter((slot) => slot.startsAt === startsAt)

		return found.length === 0 || found[0].occupied >= found[0].capacity
	}

	/**
	 * Todas as janelas da agenda do admin para um serviço em uma data.
	 * @param serviceId - Id do serviço consultado
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Janelas na ordem devolvida pela API
	 */
	public async adminSlots(
		serviceId: string,
		date: string,
		paramsDefault: IParamsDefault,
	): Promise<Array<IAvailabilitySlotResponse>> {
		const response = await getAvailability({ serviceId, date }, paramsDefault)
		const slots: Array<IAvailabilitySlotResponse> = response.json

		assertTs.isAbove(
			slots.length,
			1,
			`A agenda do serviço ${serviceId} em ${date} tem menos de duas janelas.`,
		)

		return slots
	}

	/**
	 * Agendamento específico, localizado na listagem do dia.
	 * @param appointmentId - Id do agendamento
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns O agendamento encontrado
	 */
	public async appointmentById(
		appointmentId: string,
		date: string,
		paramsDefault: IParamsDefault,
	): Promise<IAppointmentSummary> {
		const response = await getListAppointments({ from: date, to: date }, paramsDefault)
		const appointments: Array<IAppointmentSummary> = response.json

		const found = appointments.filter(
			(appointment) => appointment.id === appointmentId,
		)

		assertTs.isAbove(
			found.length,
			0,
			`Agendamento ${appointmentId} não está na agenda de ${date}.`,
		)

		return found[0]
	}

	/**
	 * Cria um profissional já com a agenda gravada.
	 * @param professional - Payload do profissional
	 * @param availability - Regras de disponibilidade (lista vazia = sem agenda)
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id do profissional criado
	 */
	public async createProfessionalWithAvailability(
		professional: ICreateProfessional,
		availability: ISaveAvailability,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)
		const updated200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const response = await postCreateProfessional(professional, created201)
		const professionalId: string = response.json.id

		await putSaveProfessionalAvailability(
			professionalId,
			availability,
			updated200,
		)

		return professionalId
	}

	/**
	 * Cria um serviço já vinculado a vários profissionais.
	 *
	 * `PUT .../professionals` substitui a lista inteira, então todos os vínculos
	 * vão em uma chamada só.
	 * @param service - Payload do serviço
	 * @param links - Vínculos completos, cada um com o seu `professionalId`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id do serviço criado
	 */
	public async createServiceWithProfessionals(
		service: ICreateService,
		links: Array<IServiceProfessionalLink>,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)
		const updated200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const response = await postCreateService(service, created201)
		const serviceId: string = response.json.id

		await putSetProfessionals(serviceId, { professionals: links }, updated200)

		return serviceId
	}

	/**
	 * Dispara, em paralelo, duas reservas de clientes distintos na mesma janela e
	 * devolve os status obtidos.
	 *
	 * Uma rodada por data: a cota de um agendamento por dia impede repetir o
	 * mesmo par de clientes na mesma data, então cada repetição usa um dia
	 * próprio — é o que permite repetir a disputa as vezes que a especificação
	 * pede sem precisar de um cliente novo por rodada.
	 * @param clients - Exatamente dois clientes do pool
	 * @param slug - Slug do tenant
	 * @param serviceId - Serviço disputado
	 * @param dates - Datas das rodadas, uma por disputa
	 * @param paramsDefault - Parâmetros padrão base
	 * @returns Para cada rodada, o par de status devolvidos
	 */
	public async raceForLastSlot(
		clients: Array<IPooledEndUser>,
		slug: string,
		serviceId: string,
		dates: Array<string>,
		paramsDefault: IParamsDefault,
	): Promise<Array<Array<number>>> {
		const authBusiness = new AuthBusiness()
		const loginParams = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
		)

		const first = await authBusiness.loginAsEndUser(
			slug,
			clients[0].email,
			clients[0].password,
			loginParams,
		)
		const second = await authBusiness.loginAsEndUser(
			slug,
			clients[1].email,
			clients[1].password,
			loginParams,
		)

		const rounds: Array<Array<number>> = []

		for (const date of dates) {
			const slot = await this.firstPublicSlot(serviceId, date, first)

			const responses = await Promise.all([
				postPublicCreateAppointmentRace(
					{ serviceId, startsAt: slot.startsAt },
					first,
				),
				postPublicCreateAppointmentRace(
					{ serviceId, startsAt: slot.startsAt },
					second,
				),
			])

			rounds.push(responses.map((response) => response.statusCode).sort())
		}

		return rounds
	}

	/**
	 * Zera os agendamentos ativos de várias datas — a versão em faixa de
	 * `cancelAllAppointmentsOnDate`, para casos que repetem a mesma disputa em
	 * dias diferentes.
	 * @param dates - Datas no formato `YYYY-MM-DD`
	 * @param reason - Motivo registrado no cancelamento
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 */
	public async cancelAllAppointmentsInRange(
		dates: Array<string>,
		reason: string,
		paramsDefault: IParamsDefault,
	): Promise<void> {
		for (const date of dates) {
			await this.cancelAllAppointmentsOnDate(date, reason, paramsDefault)
		}
	}

	/**
	 * Janela pública que começa em um horário específico do fuso do tenant.
	 *
	 * Quando o serviço tem mais de uma faixa no mesmo dia, "a primeira janela
	 * livre" não basta: o caso precisa exatamente da janela daquele horário.
	 * @param serviceId - Id do serviço consultado
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param startTime - Horário de início, `HH:mm` no fuso do tenant
	 * @param paramsDefault - Parâmetros padrão já autenticados como cliente final
	 * @returns A janela que começa em `startTime`
	 */
	public async publicSlotAtTime(
		serviceId: string,
		date: string,
		startTime: string,
		paramsDefault: IParamsDefault,
	): Promise<IAvailabilitySlotResponse> {
		const response = await getPublicAvailability({ serviceId, date }, paramsDefault)
		const slots: Array<IAvailabilitySlotResponse> = response.json.slots

		const found = slots.filter(
			(slot) => timeInTenantTimezone(slot.startsAt) === startTime,
		)

		assertTs.isAbove(
			found.length,
			0,
			`Nenhuma janela às ${startTime} para o serviço ${serviceId} em ${date}.`,
		)

		return found[0]
	}

	/**
	 * Tenta gravar vários vínculos inválidos e devolve a mensagem de erro de cada
	 * tentativa, na mesma ordem.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for` — e o caso
	 * `AG-06` percorre uma variação por campo do `ServiceProfessionalLinkDto`.
	 * @param serviceId - Serviço cujo vínculo será tentado
	 * @param links - Vínculos inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa
	 */
	public async rejectedProfessionalLinks(
		serviceId: string,
		links: Array<IServiceProfessionalLink>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const link of links) {
			const response = await putSetProfessionals(
				serviceId,
				{ professionals: [link] },
				paramsDefault,
			)

			messages.push(
				Array.isArray(response.json.message)
					? response.json.message[0]
					: response.json.message,
			)
		}

		return messages
	}

	/**
	 * Monta o cenário mínimo dos casos que só precisam de um agendamento
	 * existente: serviço agendável, pessoa nova e um agendamento criado pelo
	 * admin na primeira janela livre.
	 * @param service - Payload do serviço
	 * @param professional - Payload do profissional
	 * @param link - Vínculo serviço–profissional, sem o `professionalId`
	 * @param availability - Regras de disponibilidade do profissional
	 * @param person - Payload da pessoa que receberá o agendamento
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Ids do serviço, profissional, pessoa e agendamento, com a janela usada
	 */
	public async createAppointmentScenario(
		service: ICreateService,
		professional: ICreateProfessional,
		link: IServiceProfessionalLinkDraft,
		availability: ISaveAvailability,
		person: ICreatePerson,
		date: string,
		paramsDefault: IParamsDefault,
	): Promise<IExistingAppointment> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)
		const read200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const bookable = await this.createBookableService(
			service,
			professional,
			link,
			availability,
			paramsDefault,
		)

		const personResponse = await postCreatePerson(person, created201)
		const personId: string = personResponse.json.id

		const slot = await this.firstAdminSlot(bookable.serviceId, date, read200)

		const appointment = await postCreateAppointment(
			{ personId, serviceId: bookable.serviceId, startsAt: slot.startsAt },
			created201,
		)

		return {
			...bookable,
			personId,
			appointmentId: appointment.json.id,
			startsAt: slot.startsAt,
			endsAt: slot.endsAt,
		}
	}

	/**
	 * Tenta mudar o status de um agendamento e devolve a mensagem de erro.
	 *
	 * Recebe o status como texto livre de propósito: o caso `AG-23b` envia
	 * `pending`, que o `UpdateAppointmentStatusDto` não aceita — é justamente o
	 * que se quer provar, e o tipo do contrato impediria a chamada.
	 * @param appointmentId - Agendamento alvo
	 * @param status - Status enviado, mesmo fora do enum aceito
	 * @param reason - Motivo, quando houver
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem de erro devolvida, já serializada
	 */
	public async rejectedStatusChange(
		appointmentId: string,
		status: string,
		reason: string | undefined,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const response = await patchUpdateAppointmentStatus(
			appointmentId,
			{ status, reason } as unknown as IUpdateAppointmentStatus,
			paramsDefault,
		)

		return JSON.stringify(response.json.message)
	}

	/**
	 * Tenta reagendar com o corpo incompleto e devolve a mensagem de erro.
	 *
	 * O `RescheduleAppointmentDto` exige `startsAt` e `reason`; o caso `AG-21b`
	 * precisa justamente omitir um de cada vez, então a conversão de tipo mora
	 * aqui e não no arquivo de teste.
	 * @param appointmentId - Agendamento alvo
	 * @param payload - Corpo parcial, com `startsAt` ou `reason` ausente
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem de erro devolvida, já serializada
	 */
	public async rejectedReschedule(
		appointmentId: string,
		payload: { startsAt?: string; reason?: string },
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const response = await postRescheduleAppointment(
			appointmentId,
			payload as IRescheduleAppointment,
			paramsDefault,
		)

		return JSON.stringify(response.json.message)
	}

	/**
	 * Status devolvido pela consulta pública de disponibilidade.
	 *
	 * Devolve o número em vez do corpo porque o caso `AG-13` afere justamente o
	 * status — e o `expectStatus` do service derrubaria a chamada antes disso.
	 * @param serviceId - Id do serviço consultado
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param paramsDefault - Parâmetros padrão já autenticados como cliente final
	 * @returns Status HTTP da consulta
	 */
	public async publicAvailabilityStatus(
		serviceId: string,
		date: string,
		paramsDefault: IParamsDefault,
	): Promise<number> {
		const response = await getPublicAvailability(
			{ serviceId, date },
			preSetup.preSetupParamsDefault(
				paramsDefault.statusCode,
				0,
				0,
				paramsDefault.token,
			),
		).catch((erro: { toString: () => string }) => erro)

		return "statusCode" in response
			? (response as { statusCode: number }).statusCode
			: 0
	}

	/**
	 * Repete a mesma reserva em datas diferentes e devolve o profissional
	 * escolhido em cada uma.
	 *
	 * O desempate da distribuição automática (`AG-14`) precisa provar que a
	 * escolha é sempre a mesma; datas distintas evitam a cota de um agendamento
	 * por dia sem precisar de um cliente por rodada.
	 * @param client - Cliente do pool que fará as reservas
	 * @param slug - Slug do tenant
	 * @param serviceId - Serviço reservado
	 * @param dates - Datas das rodadas
	 * @param paramsDefault - Parâmetros padrão base
	 * @returns Id do profissional escolhido em cada rodada
	 */
	public async professionalsChosenAcrossDates(
		client: IPooledEndUser,
		slug: string,
		serviceId: string,
		dates: Array<string>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const authBusiness = new AuthBusiness()
		const clientParams = await authBusiness.loginAsEndUser(
			slug,
			client.email,
			client.password,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
			),
		)
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			clientParams.token,
		)

		const chosen: Array<string> = []

		for (const date of dates) {
			const slot = await this.firstPublicSlot(serviceId, date, clientParams)

			const response = await postPublicCreateAppointment(
				{ serviceId, startsAt: slot.startsAt },
				created201,
			)

			chosen.push(response.json.professionalId)
		}

		return chosen
	}

	/**
	 * Janela pública localizada pelo instante exato de início.
	 * @param serviceId - Id do serviço consultado
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param startsAt - Início da janela, em ISO 8601
	 * @param paramsDefault - Parâmetros padrão já autenticados como cliente final
	 * @returns A janela que começa em `startsAt`
	 */
	public async publicSlotAtStartsAt(
		serviceId: string,
		date: string,
		startsAt: string,
		paramsDefault: IParamsDefault,
	): Promise<IAvailabilitySlotResponse> {
		const response = await getPublicAvailability({ serviceId, date }, paramsDefault)
		const slots: Array<IAvailabilitySlotResponse> = response.json.slots

		const found = slots.filter((slot) => slot.startsAt === startsAt)

		assertTs.isAbove(
			found.length,
			0,
			`A janela ${startsAt} sumiu da oferta pública do serviço ${serviceId}.`,
		)

		return found[0]
	}

	/**
	 * Cancela **todos** os agendamentos ativos de um dia.
	 *
	 * Cada caso tem um dia exclusivo (`data/testDates.data.ts`), então zerar o dia
	 * inteiro é seguro e resolve o que a limpeza por pessoa não alcança: massa de
	 * execuções antigas, de clientes que o caso não usa mais, ou criada antes de
	 * uma mudança de desenho da suíte.
	 * @param date - Data no formato `YYYY-MM-DD`
	 * @param reason - Motivo registrado no cancelamento
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 */
	public async cancelAllAppointmentsOnDate(
		date: string,
		reason: string,
		paramsDefault: IParamsDefault,
	): Promise<void> {
		const read200 = preSetup.preSetupParamsDefault200(
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const response = await getListAppointments({ from: date, to: date }, read200)
		const appointments: Array<IAppointmentSummary> = response.json

		const active = appointments.filter((appointment) =>
			["pending", "approved"].includes(appointment.status),
		)

		for (const appointment of active) {
			await patchUpdateAppointmentStatus(
				appointment.id,
				{ status: "cancelled_by_admin", reason },
				read200,
			)
		}
	}
}
