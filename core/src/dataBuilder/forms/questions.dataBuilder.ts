import { faker } from "@faker-js/faker"
import type {
	IReplaceQuestion,
	IReplaceQuestions,
} from "../../interface/forms/IForms.interface"

/** Payload de `PUT /dashboard/forms/{id}/questions`. */
export default class QuestionsDataBuilder {
	private questionsData: IReplaceQuestions

	constructor() {
		this.questionsData = { questions: [] as Array<IReplaceQuestion> }
	}

	/** Zera as perguntas acumuladas, para reaproveitar o builder no mesmo processo */
	reset(): QuestionsDataBuilder {
		this.questionsData = { questions: [] as Array<IReplaceQuestion> }
		return this
	}

	/**
	 * Acrescenta uma pergunta de texto curto
	 * @param title - Enunciado da pergunta
	 * @param isRequired - Se a resposta é obrigatória
	 */
	withShortText(
		title = `Pergunta ${faker.string.alphanumeric(6)}`,
		isRequired = false,
	): QuestionsDataBuilder {
		this.questionsData.questions.push({
			type: "SHORT_TEXT",
			title,
			isRequired,
		})
		return this
	}

	/**
	 * Acrescenta uma pergunta de escolha única, com duas opções — o mínimo do contrato
	 * @param title - Enunciado da pergunta
	 */
	withSingleChoice(
		title = `Escolha ${faker.string.alphanumeric(6)}`,
	): QuestionsDataBuilder {
		this.questionsData.questions.push({
			type: "SINGLE_CHOICE",
			title,
			isRequired: false,
			options: [{ label: "Sim" }, { label: "Não" }],
		})
		return this
	}

	/**
	 * Acrescenta uma pergunta de escala
	 * @param title - Enunciado da pergunta
	 */
	withScale(
		title = `Escala ${faker.string.alphanumeric(6)}`,
	): QuestionsDataBuilder {
		this.questionsData.questions.push({
			type: "SCALE",
			title,
			isRequired: false,
		})
		return this
	}

	/**
	 * Acrescenta N perguntas de texto curto de uma vez
	 * @param quantity - Quantas perguntas criar
	 */
	withShortTexts(quantity: number): QuestionsDataBuilder {
		Array.from({ length: quantity }).forEach(() => this.withShortText())
		return this
	}

	/**
	 * Constrói o payload final.
	 *
	 * Devolve uma cópia **e volta o builder ao estado inicial**.
	 *
	 * O builder é instanciado uma vez em `@core/constants` e reaproveitado — e o
	 * Mocha em paralelo roda vários arquivos de teste no mesmo processo. Sem o
	 * reset, um `with...()` de um caso vaza para o caso seguinte do mesmo worker.
	 */
	build(): IReplaceQuestions {
		const payload = structuredClone(this.questionsData)
		this.reset()

		return payload
	}
}
