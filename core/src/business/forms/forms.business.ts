import { assertTs, preSetup } from "../../constants"
import AuthBusiness from "../auth/auth.business"
import type { ICreatePerson } from "../../interface/people/IPeople.interface"
import type {
	ICreateForm,
	IReplaceQuestion,
	IReplaceQuestions,
} from "../../interface/forms/IForms.interface"
import type { IParamsDefault } from "../../interface/global.interface"
import type { IPooledEndUser } from "../../utils/endUser.utils"
import deleteForm from "../../services/forms/deleteForm.service"
import getListForms from "../../services/forms/getListForms.service"
import getListQuestions from "../../services/forms/getListQuestions.service"
import postClose from "../../services/forms/postClose.service"
import postCreateForm from "../../services/forms/postCreateForm.service"
import postCreatePerson from "../../services/people/postCreatePerson.service"
import postPublicSubmitForm from "../../services/public/postPublicSubmitForm.service"
import postAssignForm from "../../services/forms/postAssignForm.service"
import postPublish from "../../services/forms/postPublish.service"
import putReplaceQuestions from "../../services/forms/putReplaceQuestions.service"

/** Formulário já publicado, pronto para receber respostas. */
export interface IPublishedForm {
	formId: string
	questionIds: Array<string>
}

/** Item devolvido pela listagem de formulários. */
interface IFormSummary {
	id: string
	title: string
	status: string
}

/** Pergunta devolvida por `GET /dashboard/forms/{id}/questions`. */
interface IFormQuestion {
	id: string
	type: string
	title: string
}

export default class FormsBusiness {
	/**
	 * Cria um formulário com perguntas e o publica.
	 *
	 * Publicar exige ao menos uma pergunta (`F-01`), então os dois passos andam
	 * sempre juntos nos casos que só precisam de um formulário no ar.
	 * @param form - Payload do formulário, vindo do `FormDataBuilder`
	 * @param questions - Perguntas, vindas do `QuestionsDataBuilder`
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id do formulário e das perguntas criadas
	 */
	public async createPublishedForm(
		form: ICreateForm,
		questions: IReplaceQuestions,
		paramsDefault: IParamsDefault,
	): Promise<IPublishedForm> {
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

		const formResponse = await postCreateForm(form, created201)
		const formId: string = formResponse.json.id

		await putReplaceQuestions(formId, questions, updated200)
		await postPublish(formId, created201)

		const questionsResponse = await getListQuestions(formId, updated200)
		const saved: Array<IFormQuestion> = questionsResponse.json

		return { formId, questionIds: saved.map((question) => question.id) }
	}

	/**
	 * Apaga formulários deixados por execuções anteriores do mesmo caso.
	 *
	 * O prefixo é o ID do caso, então a limpeza nunca alcança a massa de outro
	 * teste rodando em paralelo. Formulários com resposta recusam exclusão e são
	 * ignorados de propósito.
	 * @param prefix - Prefixo do título dos formulários do caso
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

		const response = await getListForms(read200)
		const forms: Array<IFormSummary> = response.json.items || response.json

		for (const form of forms.filter((item) => item.title.startsWith(prefix))) {
			await deleteForm(form.id, anyStatus).catch(() => undefined)
		}
	}

	/**
	 * Responde um formulário como cliente final, preenchendo texto em cada pergunta.
	 * @param formId - Formulário respondido
	 * @param questionIds - Perguntas do formulário
	 * @param answer - Texto usado como resposta em todas elas
	 * @param paramsDefault - Parâmetros padrão já autenticados como cliente final
	 * @returns `submissionId` da submissão criada
	 */
	public async submitTextAnswers(
		formId: string,
		questionIds: Array<string>,
		answer: string,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const response = await postPublicSubmitForm(
			formId,
			{
				answers: questionIds.map((questionId) => ({
					questionId,
					textValue: answer,
				})),
			},
			paramsDefault,
		)

		assertTs.exists(
			response.json.submissionId,
			"A submissão não devolveu `submissionId`.",
		)

		return response.json.submissionId
	}

	/**
	 * Cria um formulário publicado e o atribui a uma pessoa.
	 *
	 * Formulário com audiência `SPECIFIC` só aparece para quem tem atribuição —
	 * sem este passo o cliente nem enxerga o formulário para responder.
	 * @param form - Payload do formulário
	 * @param questions - Perguntas do formulário
	 * @param personId - Pessoa que receberá a atribuição
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id do formulário e das perguntas criadas
	 */
	public async createAssignedForm(
		form: ICreateForm,
		questions: IReplaceQuestions,
		personId: string,
		paramsDefault: IParamsDefault,
	): Promise<IPublishedForm> {
		const published = await this.createPublishedForm(
			form,
			questions,
			paramsDefault,
		)

		await postAssignForm(
			published.formId,
			{ personIds: [personId] },
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)

		return published
	}

	/**
	 * Cria N pessoas ativas e devolve os ids.
	 *
	 * Casos de audiência precisam de uma população conhecida — e criar pessoa por
	 * pessoa dentro do teste exigiria `for`, que os arquivos de teste não podem ter.
	 * @param people - Payloads das pessoas, um por pessoa a criar
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Ids das pessoas criadas, na ordem enviada
	 */
	public async createPeople(
		people: Array<ICreatePerson>,
		paramsDefault: IParamsDefault,
	): Promise<Array<string>> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const ids: Array<string> = []

		for (const person of people) {
			const response = await postCreatePerson(person, created201)
			ids.push(response.json.id)
		}

		return ids
	}

	/**
	 * Tenta gravar perguntas inválidas e devolve a resposta bruta.
	 *
	 * Recebe as perguntas já montadas porque o caso `F-05` precisa violar o
	 * `minItems: 2` do contrato — o builder, que sempre monta duas opções, não
	 * consegue produzir esse payload.
	 * @param formId - Formulário alvo
	 * @param questions - Perguntas inválidas
	 * @param paramsDefault - Parâmetros padrão com o status de erro esperado
	 * @returns Resposta da tentativa
	 */
	public async rejectedQuestions(
		formId: string,
		questions: Array<IReplaceQuestion>,
		paramsDefault: IParamsDefault,
	) {
		return await putReplaceQuestions(formId, { questions }, paramsDefault)
	}

	/**
	 * Responde uma pergunta de escala, como cliente final.
	 * @param formId - Formulário respondido
	 * @param questionId - Pergunta de escala
	 * @param value - Valor da escala
	 * @param paramsDefault - Parâmetros padrão já autenticados como cliente final
	 * @returns `submissionId` da submissão criada
	 */
	public async submitScaleAnswer(
		formId: string,
		questionId: string,
		value: number,
		paramsDefault: IParamsDefault,
	): Promise<string> {
		const response = await postPublicSubmitForm(
			formId,
			{ answers: [{ questionId, numberValue: value }] },
			paramsDefault,
		)

		return response.json.submissionId
	}

	/**
	 * Faz cada cliente responder a mesma pergunta de escala com o seu valor.
	 *
	 * Um cliente por valor: formulário `ONCE_PER_PERSON` só aceita uma resposta
	 * por pessoa, então médias com N valores exigem N clientes.
	 * @param clients - Clientes do pool, um por valor
	 * @param slug - Slug do tenant
	 * @param formId - Formulário respondido
	 * @param questionId - Pergunta de escala
	 * @param values - Valores da escala, na ordem dos clientes
	 * @param paramsDefault - Parâmetros padrão base
	 */
	public async submitScaleAnswersAsClients(
		clients: Array<IPooledEndUser>,
		slug: string,
		formId: string,
		questionId: string,
		values: Array<number>,
		paramsDefault: IParamsDefault,
	): Promise<void> {
		const authBusiness = new AuthBusiness()
		const loginParams = preSetup.preSetupParamsDefault(
			200,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
		)

		for (const [index, client] of clients.entries()) {
			const clientParams = await authBusiness.loginAsEndUser(
				slug,
				client.email,
				client.password,
				loginParams,
			)

			await this.submitScaleAnswer(
				formId,
				questionId,
				values[index],
				preSetup.preSetupParamsDefault(
					201,
					paramsDefault.retry.count,
					paramsDefault.retry.delay,
					clientParams.token,
				),
			)
		}
	}

	/**
	 * Responde o mesmo formulário N vezes, como o mesmo cliente.
	 *
	 * Só faz sentido em formulário `MULTIPLE`; serve aos casos que precisam de uma
	 * quantidade conhecida de submissões para conferir agregados e paginação.
	 * @param formId - Formulário respondido
	 * @param questionIds - Perguntas do formulário
	 * @param answer - Texto usado como resposta
	 * @param times - Quantas submissões criar
	 * @param paramsDefault - Parâmetros padrão já autenticados como cliente final
	 */
	public async submitTextAnswersTimes(
		formId: string,
		questionIds: Array<string>,
		answer: string,
		times: number,
		paramsDefault: IParamsDefault,
	): Promise<void> {
		for (let attempt = 0; attempt < times; attempt++) {
			await this.submitTextAnswers(formId, questionIds, answer, paramsDefault)
		}
	}

	/**
	 * Monta um formulário sensível já respondido por um cliente do pool.
	 *
	 * É o cenário base dos casos de permissão: sem uma submissão sensível
	 * existente, não há o que autorizar nem o que recusar.
	 * @param form - Payload do formulário, já marcado como sensível
	 * @param questions - Perguntas do formulário
	 * @param client - Cliente do pool que responderá
	 * @param slug - Slug do tenant
	 * @param answer - Texto da resposta
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id do formulário e da submissão criada
	 */
	public async createAnsweredSensitiveForm(
		form: ICreateForm,
		questions: IReplaceQuestions,
		client: IPooledEndUser,
		slug: string,
		answer: string,
		paramsDefault: IParamsDefault,
	): Promise<{ formId: string; submissionId: string }> {
		const authBusiness = new AuthBusiness()

		const published = await this.createAssignedForm(
			form,
			questions,
			client.personId,
			paramsDefault,
		)

		const clientParams = await authBusiness.loginAsEndUser(
			slug,
			client.email,
			client.password,
			preSetup.preSetupParamsDefault(
				200,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
			),
		)

		const submissionId = await this.submitTextAnswers(
			published.formId,
			published.questionIds,
			answer,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				clientParams.token,
			),
		)

		return { formId: published.formId, submissionId }
	}

	/**
	 * Monta um formulário respondido e já encerrado.
	 *
	 * É a pré-condição dos grupos de origem `form`: a API só aceita gerar grupo a
	 * partir de formulário `CLOSED`.
	 * @param form - Payload do formulário
	 * @param questions - Perguntas do formulário
	 * @param client - Cliente do pool que responderá
	 * @param slug - Slug do tenant
	 * @param answer - Texto da resposta
	 * @param times - Quantas respostas enviar (formulário `MULTIPLE`)
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id do formulário encerrado e da pessoa que respondeu
	 */
	public async createClosedAnsweredForm(
		form: ICreateForm,
		questions: IReplaceQuestions,
		client: IPooledEndUser,
		slug: string,
		answer: string,
		times: number,
		paramsDefault: IParamsDefault,
	): Promise<{ formId: string; personId: string }> {
		const authBusiness = new AuthBusiness()

		const published = await this.createAssignedForm(
			form,
			questions,
			client.personId,
			paramsDefault,
		)

		const clientParams = await authBusiness.loginAsEndUser(
			slug,
			client.email,
			client.password,
			preSetup.preSetupParamsDefault(
				200,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
			),
		)

		await this.submitTextAnswersTimes(
			published.formId,
			published.questionIds,
			answer,
			times,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				clientParams.token,
			),
		)

		await postClose(
			published.formId,
			preSetup.preSetupParamsDefault(
				201,
				paramsDefault.retry.count,
				paramsDefault.retry.delay,
				paramsDefault.token,
			),
		)

		return { formId: published.formId, personId: client.personId }
	}

	/**
	 * Monta um formulário de escala respondido por vários clientes e o encerra.
	 *
	 * É a pré-condição da formação de grupos por resposta: cada cliente responde
	 * com o seu valor, e o formulário precisa estar `CLOSED` para virar grupo.
	 * @param form - Payload do formulário
	 * @param clients - Clientes do pool, um por valor
	 * @param slug - Slug do tenant
	 * @param values - Valores da escala, na ordem dos clientes
	 * @param paramsDefault - Parâmetros padrão já autenticados como admin do tenant
	 * @returns Id do formulário e o valor respondido por pessoa
	 */
	public async createClosedScaleForm(
		form: ICreateForm,
		clients: Array<IPooledEndUser>,
		slug: string,
		values: Array<number>,
		paramsDefault: IParamsDefault,
	): Promise<{ formId: string; answerByPerson: Record<string, number> }> {
		const created201 = preSetup.preSetupParamsDefault(
			201,
			paramsDefault.retry.count,
			paramsDefault.retry.delay,
			paramsDefault.token,
		)

		const published = await this.createPublishedForm(
			form,
			{
				questions: [
					{ type: "SCALE", title: "Nível de experiência", isRequired: true },
				],
			},
			paramsDefault,
		)

		await postAssignForm(
			published.formId,
			{ personIds: clients.map((client) => client.personId) },
			created201,
		)

		await this.submitScaleAnswersAsClients(
			clients,
			slug,
			published.formId,
			published.questionIds[0],
			values,
			paramsDefault,
		)

		await postClose(published.formId, created201)

		const answerByPerson: Record<string, number> = {}
		clients.forEach((client, index) => {
			answerByPerson[client.personId] = values[index]
		})

		return { formId: published.formId, answerByPerson }
	}
}
