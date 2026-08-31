import { faker } from "@faker-js/faker"
import type { ICreateForm } from "../../interface/forms/IForms.interface"

/** Payload de `POST /dashboard/forms`. */
export default class FormDataBuilder {
	private formData: ICreateForm

	constructor() {
		this.formData = FormDataBuilder.defaults()
	}

	/** Estado inicial, recriado a cada `build()`. */
	private static defaults(): ICreateForm {
		return {
			title: `[QA] Formulário ${faker.string.alphanumeric(8)}`,
			description: "",
			type: "SURVEY",
			containsSensitiveData: false,
			submissionMode: "ONCE_PER_PERSON",
		}
	}

	/**
	 * Define o título do formulário, sufixado para não colidir entre execuções
	 * @param title - Prefixo do título, normalmente o ID do caso de teste
	 */
	withTitle(title: string): FormDataBuilder {
		this.formData.title = `${title} ${faker.string.alphanumeric(8)}`
		return this
	}

	/**
	 * Define se o formulário guarda dado sensível — muda quem pode ler as respostas
	 * @param containsSensitiveData - `true` exige `canViewSensitiveData` no admin
	 */
	withSensitiveData(containsSensitiveData: boolean): FormDataBuilder {
		this.formData.containsSensitiveData = containsSensitiveData
		return this
	}

	/**
	 * Define o tipo do formulário
	 * @param type - Tipo declarado no contrato (ex.: `TEAM_FORMATION`)
	 */
	withType(type: ICreateForm["type"]): FormDataBuilder {
		this.formData.type = type
		return this
	}

	/**
	 * Define quantas vezes a mesma pessoa pode responder
	 * @param submissionMode - `ONCE_PER_PERSON` ou `MULTIPLE`
	 */
	withSubmissionMode(
		submissionMode: "ONCE_PER_PERSON" | "MULTIPLE",
	): FormDataBuilder {
		this.formData.submissionMode = submissionMode
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
	build(): ICreateForm {
		const payload = structuredClone(this.formData)
		this.formData = FormDataBuilder.defaults()

		return payload
	}
}
