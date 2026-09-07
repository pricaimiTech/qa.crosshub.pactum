import { preSetup } from "@core/constants"

/** Login responde 200, como o contrato declara (#86 corrigido). */
const loginParams = preSetup.preSetupParamsDefault(200, 5, 500)

const peopleDefaults = {
	/** Senha numérica usada nas ativações deste módulo. */
	pin: "1234",
	loginParams,
	paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
	paramsDefault200: (token?: string) =>
		preSetup.preSetupParamsDefault200(5, 500, token),
	paramsDefault201: (token?: string) =>
		preSetup.preSetupParamsDefault(201, 5, 500, token),
	paramsDefault400: (token?: string) =>
		preSetup.preSetupParamsDefault(400, 5, 500, token),
	paramsDefault401: (token?: string) =>
		preSetup.preSetupParamsDefault(401, 5, 500, token),
	paramsDefault404: (token?: string) =>
		preSetup.preSetupParamsDefault(404, 5, 500, token),
	paramsDefault409: (token?: string) =>
		preSetup.preSetupParamsDefault(409, 5, 500, token),
}

/** `API-C-01` — cadastro mínimo nasce ativo e com os opcionais nulos. */
export const peopleC01 = {
	...peopleDefaults,
	casePrefix: "[C-01]",
	expectedStatus: "active",
	nullableFields: ["phone", "birthDate", "document", "gender"] as Array<string>,
}

/** `API-C-01b` — e-mail é obrigatório no cadastro. */
export const peopleC01b = {
	...peopleDefaults,
	casePrefix: "[C-01b]",
	errorMessage: "E-mail é obrigatório para cadastrar um cliente.",
}

/** `API-C-02` — normalização de e-mail e telefone. */
/** E-mail único por execução: e-mail repetido é 409 no tenant, e o caso mede a normalização, não a duplicidade. */
const c02Stamp = Date.now().toString(36)
export const peopleC02 = {
	...peopleDefaults,
	casePrefix: "[C-02]",
	rawEmail: ` Maria.${c02Stamp}@Exemplo.COM `,
	expectedEmail: `maria.${c02Stamp}@exemplo.com`,
	rawPhone: "",
}

/** `API-C-03` — limites dos campos opcionais. */
export const peopleC03 = {
	...peopleDefaults,
	casePrefix: "[C-03]",
	longNotes: "N".repeat(501),
	longDocument: "D".repeat(41),
	invalidGender: "Indefinido",
	invalidBirthDate: "20-05-1990",
	messages: {
		notes: "Observações devem ter no máximo 500 caracteres.",
		document: "Documento deve ter no máximo 40 caracteres.",
		gender: "Gênero inválido.",
		birthDate: "Data de nascimento inválida.",
	},
}

/** `API-C-04` — o código de acesso precisa de um canal de contato. */
export const peopleC04 = {
	...peopleDefaults,
	casePrefix: "[C-04]",
}

/** `API-C-05` — só um código ativo por pessoa. */
export const peopleC05 = {
	...peopleDefaults,
	casePrefix: "[C-05]",
}

/** `API-C-06` — regenerar revoga o código anterior. */
export const peopleC06 = {
	...peopleDefaults,
	casePrefix: "[C-06]",
	/** Código revogado é tratado como credencial inválida: 401, não 400. */
	revokedCodeStatus: 401,
}

/** `API-C-07` — o código em texto puro aparece uma única vez. */
export const peopleC07 = {
	...peopleDefaults,
	casePrefix: "[C-07]",
}

/** `API-C-08` — pessoa revogada não recebe código novo. */
export const peopleC08 = {
	...peopleDefaults,
	casePrefix: "[C-08]",
}

/** `API-C-09` — ativação completa devolve token e consome o código. */
export const peopleC09 = {
	...peopleDefaults,
	casePrefix: "[C-09]",
}

/** `API-C-10` — variações inválidas de ativação. */
export const peopleC10 = {
	...peopleDefaults,
	casePrefix: "[C-10]",
	shortPin: "123",
	longPin: "1234567",
	nonNumericPin: "abcd",
	pinMessage: "O PIN deve ter de 4 a 6 dígitos.",
	consentMessage: "Slug, código, senha e consentimento são obrigatórios.",
}

/** `API-C-11` — o nome informado na ativação não sobrescreve o cadastro. */
export const peopleC11 = {
	...peopleDefaults,
	casePrefix: "[C-11]",
	socialName: "Nome social do cliente",
}

/** `API-C-12` — remover acesso preserva o cadastro e derruba o login. */
export const peopleC12 = {
	...peopleDefaults,
	casePrefix: "[C-12]",
	expectedStatus: "revoked",
}

/** `API-C-XT` — isolamento entre tenants. */
export const peopleCXT = {
	...peopleDefaults,
	casePrefix: "[C-XT]",
	updatedNotes: "Tentativa de edição cruzada",
}

/**
 * `API-C-13` — validações do upload de foto.
 *
 * Os arquivos são gerados na pasta temporária a cada execução: um JPEG de 5 MB
 * não deve ser versionado, e o limite precisa ser exercitado dos dois lados.
 */
export const peopleC13 = {
	...peopleDefaults,
	casePrefix: "[C-13]",
	errorMessage: "Envie JPEG, PNG ou WebP com até 5 MB.",
	/** Um byte acima do limite de 5 MB. */
	oversizedBytes: 5 * 1024 * 1024 + 1,
	/** Confortavelmente abaixo do limite. */
	acceptedBytes: Math.round(4.9 * 1024 * 1024),
	paramsDefault413: (token?: string) =>
		preSetup.preSetupParamsDefault(413, 5, 500, token),
}

/** `API-C-14` — remover a foto limpa a URL pública. */
export const peopleC14 = {
	...peopleDefaults,
	casePrefix: "[C-14]",
	photoBytes: 64 * 1024,
}

/**
 * `API-C-16` — volume sem paginação.
 *
 * A rota não tem `page`/`pageSize` no contrato: a listagem devolve tudo. O caso
 * mede o tamanho da resposta para embasar a decisão de paginar — por isso não
 * cria 500 pessoas, o que só inflaria a base a cada execução.
 */
export const peopleC16 = {
	...peopleDefaults,
	casePrefix: "[C-16]",
	/** Dentro do máximo de 100 do contrato. */
	pageSize: 2,
}

/**
 * `API-C-15` — cada ação sobre a pessoa deixa um evento em `audit_logs`, agora
 * legível por `GET /dashboard/audit-logs` (#96/#98).
 */
export const peopleC15 = {
	...peopleDefaults,
	casePrefix: "[C-15]",
	expectedActions: [
		"person.created",
		"person.updated",
		"access_code.created",
		"access_code.regenerated",
		"access_code.revoked",
		"person.access_removed",
	],
}
