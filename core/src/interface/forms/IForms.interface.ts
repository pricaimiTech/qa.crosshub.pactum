/**
 * Contratos do domínio `forms` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IAssignForm {
	personIds: Array<string>
	sourceType?: "MANUAL" | "GROUP"
	/** Rótulo de origem exibido ao respondente (ex.: nome do grupo). */
	sourceLabel?: string
	/** Agenda a liberação do formulário. Quando omitido, fica disponível imediatamente. */
	availableAt?: string
}

export interface ICreateForm {
	title: string
	description?: string
	type: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	/** Marca o formulário como sensível: só administradores autorizados veem as respostas. */
	containsSensitiveData?: boolean
	submissionMode?: "ONCE_PER_PERSON" | "MULTIPLE"
}

export interface IDuplicatedForm {
	id: string
	tenantId: string
	title: string
	description: string
	type: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	status: "DRAFT" | "PUBLISHED" | "CLOSED" | "UNPUBLISHED" | "ARCHIVED"
	submissionMode: "ONCE_PER_PERSON" | "MULTIPLE"
	audienceMode: "ALL_ACTIVE" | "SPECIFIC"
	containsSensitiveData: boolean
	showResultToPerson: boolean
	completionMessage: string
	publishedAt: string | null
	closedAt: string | null
	createdAt: string
	updatedAt: string
	/** Sempre 0: a cópia nasce sem respostas. */
	responses: 0
}

export interface IFormAssignment {
	id: string
	personId: string
	personName: string
	personEmail: string | null
	status: "PENDING" | "AVAILABLE" | "OPENED" | "COMPLETED" | "EXPIRED" | "CANCELLED"
	sourceType: "MANUAL" | "GROUP"
	sourceLabel: string
	availableAt: string
	submittedAt: string | null
}

export interface IFormAssignmentList {
	/** `ALL_ACTIVE` quando o formulário foi publicado para todos os clientes ativos. */
	audienceMode: "ALL_ACTIVE" | "SPECIFIC"
	assignments: Array<IFormAssignment>
}

export interface IForm {
	id: string
	tenantId: string
	title: string
	description: string
	type: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	status: "DRAFT" | "PUBLISHED" | "CLOSED" | "UNPUBLISHED" | "ARCHIVED"
	submissionMode: "ONCE_PER_PERSON" | "MULTIPLE"
	audienceMode: "ALL_ACTIVE" | "SPECIFIC"
	containsSensitiveData: boolean
	showResultToPerson: boolean
	completionMessage: string
	publishedAt: string | null
	closedAt: string | null
	createdAt: string
	updatedAt: string
}

export interface IFormInsights {
	form: IInsightsForm
	totals: IInsightsTotals
	/** Em ordem cronológica crescente. */
	responsesByDay: Array<IResponsesByDay>
	/** Pergunta de escala usada nos totais gerais. */
	primaryScaleQuestionId: string | null
	scaleQuestions: Array<IScaleQuestion>
	/** Nulo quando nenhuma pergunta se qualifica como NPS. */
	nps: INps
	/** Perguntas de escala ordenadas da maior média para a menor. */
	questionRankings: Array<IQuestionRanking>
	recentSubmissions: Array<IRecentSubmission>
}

export interface IFormListItem {
	id: string
	title: string
	description: string
	type: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	status: "DRAFT" | "PUBLISHED" | "CLOSED" | "UNPUBLISHED" | "ARCHIVED"
	submissionMode: "ONCE_PER_PERSON" | "MULTIPLE"
	containsSensitiveData: boolean
	updatedAt: string
	publishedAt: string | null
	closedAt: string | null
	/** Total de respostas recebidas. */
	responses: number
	questionCount: number
}

export interface IInsightsForm {
	id: string
	title: string
	type: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	status: "DRAFT" | "PUBLISHED" | "CLOSED" | "UNPUBLISHED" | "ARCHIVED"
	submissionMode: "ONCE_PER_PERSON" | "MULTIPLE"
	audienceMode: "ALL_ACTIVE" | "SPECIFIC"
	containsSensitiveData: boolean
	publishedAt: string | null
}

export interface IInsightsTotals {
	responses: number
	/** Denominador da taxa de resposta: o total de pessoas atribuídas quando o
público é `SPECIFIC`, ou o próprio total de respostas caso contrário. */
	eligibleTotal: number
	responseRatePercent: number | null
	uniqueParticipants: number
	/** Nulo quando não há dados de duração. */
	averageDurationSeconds: number | null
	/** Média da primeira pergunta de escala; nula sem perguntas de escala. */
	overallAverage: number | null
	/** Topo da escala usada em `overallAverage`. */
	overallMaxScale: number
	/** 100 quando há ao menos uma resposta; nulo quando não há nenhuma. */
	completionRatePercent: number | null
}

export interface INps {
	score: number
	promotersPercent: number
	passivesPercent: number
	detractorsPercent: number
}

export interface IPublishToAllActive {
	form: IForm
	/** Quantas pessoas ativas receberam o formulário. */
	totalActivePeople: number
}

export interface IQuestionOptionInput {
	label: string
	/** Valor persistido da opção. */
	value?: string
}

export interface IQuestionRanking {
	questionId: string
	title: string
	average: number
	maxScale: number
}

export interface IRecentSubmission {
	id: string
	personName: string
	/** Identificador do atendimento de origem, quando houver. */
	contextLabel: string | null
	/** Média das respostas de escala desta submissão. */
	rating: number | null
	submittedAt: string
}

export interface IReplaceQuestion {
	type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "SCALE" | "CONSENT"
	title: string
	isRequired?: boolean
	/** Obrigatório com ao menos duas entradas para `SINGLE_CHOICE` e `MULTIPLE_CHOICE`. */
	options?: Array<IQuestionOptionInput>
	/** Texto do termo apresentado ao respondente. */
	consentText?: string
	/** Versão do termo, registrada junto à resposta. */
	consentVersion?: string
}

export interface IReplaceQuestions {
	/** Substitui integralmente as perguntas do formulário. */
	questions: Array<IReplaceQuestion>
}

export interface IResponsesByDay {
	date: string
	count: number
}

export interface IScaleBucket {
	/** Valor da escala. */
	value: number
	count: number
	percent: number
}

export interface IScaleQuestion {
	questionId: string
	title: string
	/** Nula quando a pergunta não recebeu respostas. */
	average: number | null
	maxScale: number
	minScale: number
	/** Do maior valor da escala para o menor. */
	distribution: Array<IScaleBucket>
}

export interface ISubmissionAnswer {
	id: string
	questionId: string
	questionTitle: string
	questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "SCALE" | "CONSENT"
	/** Valor já formatado para exibição; `—` quando a resposta ficou em branco. */
	displayValue: string
	/** Presente apenas em perguntas do tipo CONSENT. */
	consentText?: string | null
	/** Presente apenas em perguntas do tipo CONSENT. */
	consentVersion?: string | null
	/** Presente apenas em perguntas do tipo CONSENT. */
	consentedAt?: string | null
}

export interface ISubmissionDetail {
	id: string
	formId: string
	formTitle: string
	formType: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	containsSensitiveData: boolean
	personId: string
	personName: string
	personEmail: string | null
	personPhone: string | null
	submittedAt: string
	/** Na ordem das perguntas do formulário. */
	answers: Array<ISubmissionAnswer>
}

export interface ISubmissionListItem {
	id: string
	formId: string
	formTitle: string
	formType: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	personId: string
	personName: string
	personEmail: string | null
	containsSensitiveData: boolean
	submittedAt: string
}

export interface ISubmissionPage {
	items: Array<ISubmissionListItem>
	/** Total de respostas que atendem ao filtro, ignorando a paginação. */
	total: number
	page: number
	pageSize: number
	totalPages: number
}

export interface IUpdateForm {
	title?: string
	description?: string
	type?: "ASSESSMENT" | "FEEDBACK" | "ANAMNESIS" | "SURVEY" | "TEAM_FORMATION" | "REGISTRATION" | "KNOWLEDGE_QUIZ" | "BLANK"
	containsSensitiveData?: boolean
	submissionMode?: "ONCE_PER_PERSON" | "MULTIPLE"
}

/** Query string de `GET /dashboard/forms/submissions`. */
export interface IGetListAllSubmissionsQuery {
	/** Página, começando em 1. */
	page?: number
	/** Itens por página. */
	pageSize?: number
	/** Filtra por pessoa. */
	personId?: string
}

/** Query string de `GET /dashboard/forms/{id}/submissions`. */
export interface IGetListFormSubmissionsQuery {
	/** Página, começando em 1. */
	page?: number
	/** Itens por página. */
	pageSize?: number
}
