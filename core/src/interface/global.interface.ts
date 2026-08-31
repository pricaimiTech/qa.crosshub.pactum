/** Política de retry aplicada pelo Pactum em cada service. */
export interface IRetry {
	count: number
	delay: number
}

/** Parâmetros padrão aceitos por todo service. */
export interface IParamsDefault {
	/** Status HTTP esperado na resposta. */
	statusCode: number
	/** Retry aplicado enquanto o status esperado não chega. */
	retry: IRetry
	/** Token Bearer usado no header `Authorization`. */
	token?: string
	/** Slug do tenant, quando a rota ou o header exigir. */
	tenantSlug?: string
}

/** Corpo de erro padrão do Nest devolvido pela API do CrossHub. */
export interface IApiError {
	statusCode: number
	message: string | Array<string>
	error?: string
}

/**
 * Bug já aberto no board de QA para um caso que segue vermelho de propósito.
 * O teste continua fiel à especificação — o bug documenta por que ele falha.
 */
export interface IKnownBug {
	/** Número da issue no repositório onde ela foi aberta. */
	number: number
	/** URL da issue, exibida no título do teste e na mensagem de falha. */
	url: string
	/** Resumo em uma linha, o mesmo título da issue. */
	summary: string
}
