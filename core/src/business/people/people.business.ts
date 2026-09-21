import { assertTs, preSetup } from "../../constants"
import type { IPublicActivationRequest } from "../../interface/auth/IAuth.interface"
import type { ICreatePerson } from "../../interface/people/IPeople.interface"
import type { IParamsDefault } from "../../interface/global.interface"
import postCreateCode from "../../services/people/postCreateCode.service"
import postCreatePerson from "../../services/people/postCreatePerson.service"
import postActivate from "../../services/auth/postActivate.service"
import patchUpdatePerson from "../../services/people/patchUpdatePerson.service"
import postCreatePersonService from "../../services/people/postCreatePerson.service"
import postCreatePersonRace from "../../services/people/postCreatePersonRace.service"
import getListPeople from "../../services/people/getListPeople.service"
import postRegenerateCode from "../../services/people/postRegenerateCode.service"

/** Cliente final já ativado, pronto para logar no app do tenant. */
export interface IActivatedPerson {
	personId: string
	email: string
	password: string
}

export default class PeopleBusiness {
	/**
	 * Percorre a cadeia inteira do cliente final: cria a pessoa no dashboard,
	 * gera o código de acesso e ativa a conta com senha e consentimento.
	 *
	 * Sem isso não existe token `endUserAuth` — e é ele que separa o que o
	 * cliente enxerga do que só o admin enxerga.
	 * @param person - Payload da pessoa, vindo do `PersonDataBuilder`
	 * @param slug - Slug do tenant onde a pessoa será ativada
	 * @param password - Senha numérica de 4 a 6 dígitos usada na ativação
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id, e-mail e senha da pessoa ativada
	 */
	public async createActivatedPerson(
		person: ICreatePerson,
		slug: string,
		password: string,
		paramsDefault: IParamsDefault,
	): Promise<IActivatedPerson> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)
		/** A ativação responde 200, como o contrato declara (#86 corrigido). */
		const activated200 = preSetup.preSetupParamsDefault(
			200,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
		)

		const personResponse = await postCreatePerson(person, created201)
		const personId: string = personResponse.json.id

		const codeResponse = await postCreateCode(personId, created201)
		const code: string = codeResponse.json.code

		assertTs.exists(code, "Geração de código de acesso não devolveu o código.")

		await postActivate(
			{ slug, code, password, consent: true, name: person.name },
			activated200,
		)

		return { personId, email: `${person.email}`, password }
	}

	/**
	 * Cria uma pessoa e gera o código de acesso, sem ativar.
	 *
	 * É o cenário base dos casos que exercitam o próprio código — emissão,
	 * unicidade, regeneração — e que por isso não podem consumi-lo.
	 * @param person - Payload da pessoa, vindo do `PersonDataBuilder`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id da pessoa e o código em texto puro
	 */
	public async createPersonWithCode(
		person: ICreatePerson,
		paramsDefault: IParamsDefault,
	): Promise<{ personId: string; code: string }> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const personResponse = await postCreatePersonService(person, created201)
		const personId: string = personResponse.json.id

		const codeResponse = await postCreateCode(personId, created201)

		return { personId, code: codeResponse.json.code }
	}

	/**
	 * Pessoa com um e-mail literal, criando só se ela ainda não existir, mais um
	 * código de acesso novo.
	 *
	 * O caso `C-17` precisa do e-mail **do administrador do tenant**, que não
	 * pode ser sufixado. Criar direto funciona uma vez: na segunda execução a
	 * própria unicidade que o caso existe para provar (dev.CrossHub#175) recusa
	 * o cadastro, e o `before` quebra por um motivo que não é o do caso.
	 * @param email - E-mail literal da pessoa
	 * @param person - Payload usado só quando a pessoa ainda não existe
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id da pessoa e um código de acesso ativo
	 */
	public async ensurePersonWithCode(
		email: string,
		person: ICreatePerson,
		paramsDefault: IParamsDefault,
	): Promise<{ personId: string; code: string }> {
		const listed = await getListPeople(
			{},
			preSetup.preSetupParamsDefault200(
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)
		const existing = (listed.json as Array<{ id: string; email: string | null }>).find(
			(candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
		)

		if (!existing) return this.createPersonWithCode(person, paramsDefault)

		// Regenerar revoga o código anterior e devolve um novo: o da execução
		// passada foi consumido ou ficou pendurado.
		const codeResponse = await postRegenerateCode(
			existing.id,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)

		return { personId: existing.id, code: codeResponse.json.code }
	}

	/**
	 * Tenta criar pessoas inválidas e devolve a mensagem de erro de cada tentativa.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for` — e o caso
	 * `C-03` percorre uma variação por campo. Os payloads vêm parcialmente
	 * tipados porque o objetivo é justamente violar o contrato.
	 * @param people - Payloads inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, já serializada
	 */
	public async rejectedPeople(
		people: Array<Record<string, unknown>>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const person of people) {
			const response = await postCreatePersonService(
				person as unknown as ICreatePerson,
				paramsDefault,
			)

			messages.push(JSON.stringify(response.json.message))
		}

		return messages
	}

	/**
	 * Cadastra um cliente e devolve o id.
	 * @param person - Payload da pessoa, vindo do `PersonDataBuilder`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id da pessoa criada
	 */
	public async createPerson(
		person: ICreatePerson,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const response = await postCreatePerson(
			person,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)

		return response.json.id
	}

	/**
	 * Dispara duas criações **ao mesmo tempo** com o mesmo payload.
	 *
	 * É o que a consulta prévia de e-mail não alcança: as duas requisições
	 * passam por ela antes de qualquer insert. Em sequência, o teste passaria
	 * mesmo com o defeito de volta (dev.CrossHub#175).
	 * @param person - Payload idêntico para as duas requisições
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Os dois status, na ordem em que as respostas chegaram
	 */
	public async createPeopleRace(
		person: ICreatePerson,
		paramsDefault: IParamsDefault,
	): Promise<Array<number>> {
		const responses = await Promise.all([
			postCreatePersonRace(person, paramsDefault),
			postCreatePersonRace(person, paramsDefault),
		])

		return responses.map((response) => response.statusCode)
	}

	/**
	 * Cria uma pessoa **sem e-mail e sem telefone**.
	 *
	 * O `PersonDataBuilder` sempre gera e-mail, porque é o que o cadastro exige.
	 * O caso `C-04` precisa do oposto: alguém sem canal de contato, para provar
	 * que o código de acesso não tem como ser entregue.
	 * @param person - Payload da pessoa; o contato é esvaziado logo em seguida
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id da pessoa criada
	 */
	public async createPersonWithoutContact(
		person: ICreatePerson,
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

		// A criação exige e-mail, então o contato é esvaziado depois — é o único
		// caminho que a API oferece para chegar a uma pessoa sem canal.
		const response = await postCreatePersonService(person, created201)
		const personId: string = response.json.id

		await patchUpdatePerson(
			personId,
			{ name: person.name, email: null, phone: null },
			updated200,
		)

		return personId
	}

	/**
	 * Tenta ativar com payloads inválidos e devolve a mensagem de cada tentativa.
	 *
	 * O laço mora aqui porque os arquivos de teste não podem ter `for`. Os
	 * payloads são parcialmente tipados porque o objetivo é violar o contrato —
	 * PIN curto, longo, não numérico e consentimento negado.
	 * @param attempts - Payloads inválidos, um por variação
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Mensagem devolvida em cada tentativa, já serializada
	 */
	public async rejectedActivations(
		attempts: Array<Record<string, unknown>>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const messages: Array<string> = []

		for (const attempt of attempts) {
			const response = await postActivate(
				attempt as unknown as IPublicActivationRequest,
				paramsDefault,
			)

			messages.push(JSON.stringify(response.json.message))
		}

		return messages
	}
}
