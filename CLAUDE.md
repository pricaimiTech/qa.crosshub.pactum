# Documentação da Arquitetura — Projeto QA CrossHub API

Visão geral do repositório e referência rápida. **Padrões de implementação por tipo de arquivo** estão nas skills em `.claude/` (ex.: `create-data`, `create-test-e2e`, `create-service`).

## Estrutura geral

### Organização

- **Domínios da API** (um por módulo, espelhando `apps/api/src` do CrossHub): `addons`, `appointments`, `audit`, `auth`, `banners`, `billing`, `branding`, `catalog`, `dashboard`, `forms`, `groups`, `people`, `plans`, `privacy`, `tenants` — `audit` não tem nenhum endpoint no contrato atual
- **Core compartilhado**: `core/src` (services, interfaces, dataBuilder, utils, business, constants)
- **Setup prévio**: `preSetup/` — login e massa de dados executados antes da suíte
- **Dados compartilhados entre domínios**: `data/`
- **Configuração**: `.env.<ambiente>`, `constants.ts` (raiz), `package.json`, `.mocharc.js`, `tsconfig.json`
- **Contrato da API**: `openapi.json` na raiz — fonte de verdade de rotas, payloads e schemas
- **Estratégia de testes**: `.doc/dashboard/estrategia-testes-dashboard.json` (artefato de build do HTML irmão) — 166 casos de API do dashboard, cada um com rota, token, status e asserção literal. Rastreados em `docs/plans/mapa-casos-api.md`

### Pastas por domínio

```text
<dominio>/
├── data/               # [funcionalidade].data.ts do domínio
└── tests/
    ├── e2e/            # [CÓDIGO]-E.test.ts
    └── functional/     # [CÓDIGO]-F.test.ts
```

Não há testes de contrato neste projeto (apenas `e2e` e `functional`).

### Core (`core/src/`)

```text
src/
├── constants.ts        # specPactumJs(), assertTs, storage, preSetup params
├── env.ts              # carrega o .env.<ambiente> certo (ver seção Ambientes)
├── services/           # chamadas HTTP (*.service.ts), por domínio
├── business/           # fluxos reutilizáveis (*.business.ts), por domínio
├── dataBuilder/        # builders fluentes de payload
├── interface/          # I*.interface.ts
├── data/               # api.data.ts (prefixos de rota), paramsDefault.data.ts
└── utils/              # helpers puros
```

## Base URL e prefixos de rota

Não há prefixo global no Nest — as rotas começam direto nos caminhos abaixo. Usar sempre `${process.env.BASE_URL}${apiName.<chave>}/...` nos services (`core/src/data/api.data.ts`):

```typescript
const apiName = {
  authPlatform: "/auth/platform",
  adminAddOns: "/admin/add-ons",
  adminBilling: "/admin/billing",
  adminPlans: "/admin/plans",
  adminTenants: "/admin/tenants",
  dashboard: "/dashboard",
  dashboardAppointments: "/dashboard/appointments",
  dashboardBanners: "/dashboard/banners",
  dashboardBranding: "/dashboard/branding",
  dashboardForms: "/dashboard/forms",
  dashboardGroups: "/dashboard/groups",
  dashboardPeople: "/dashboard/people",
  dashboardCategories: "/dashboard/categories",
  dashboardPrivacy: "/dashboard/privacy",
  dashboardProducts: "/dashboard/products",
  dashboardReservations: "/dashboard/reservations",
  public: "/public",
  publicAppointments: "/public/appointments",
  publicForms: "/public/forms",
  publicMe: "/public/me",
  publicProducts: "/public/products",
  publicTenants: "/public/tenants",
  assets: "/assets",
  health: "/health",
}
```

## Código gerado a partir do `openapi.json`

Services e interfaces **não são escritos à mão** — são gerados do contrato:

```bash
npm run generate:api            # regenera interfaces + services (preserva o que já existe)
node scripts/generate-from-openapi.mjs --force   # sobrescreve tudo que é gerado
node scripts/generate-from-openapi.mjs --dry     # só mostra o que mudaria
npm run generate:map            # reconstrói docs/plans/mapa-casos-api.md
```

`generate:map` também **valida** a estratégia contra o contrato: sai com erro se algum caso
apontar para uma rota sem service, ou se uma rota marcada como `inexistente` na estratégia
passar a existir no `openapi.json`. Rodar depois de todo `generate:api`.

- **Interfaces**: um arquivo por domínio, `core/src/interface/<dominio>/I<Dominio>.interface.ts`. Schemas usados por mais de um domínio vão para `core/src/interface/shared/IShared.interface.ts`. `ApiErrorResponse` do contrato é mapeado para o `IApiError` já existente em `global.interface.ts`.
- **Services**: um arquivo por operação, `core/src/services/<dominio>/<nome>.service.ts`. Assinatura: `(path params..., query?, payload?, paramsDefault)`.
- **Nomes**: derivados do `operationId`; nomes genéricos (`postCreate`, `getList`) são corrigidos pelo mapa `NAME_OVERRIDES` no topo do gerador — é lá que se ajusta o nome de um service, não no arquivo gerado.
- **Arquivos preservados**: a lista `PRESERVED` no gerador protege código escrito à mão (hoje `postPlatformLogin` e `postTenantLogin`, que declaram a rota na tag JSDoc `@rota` para entrar na conferência do mapa). Services que somem do contrato são removidos na regeração.
- **Business, dataBuilder, data e testes continuam sendo escritos à mão** — o gerador não toca neles.

Ao mudar a API: exportar o novo `openapi.json`, rodar `npm run generate:api --force`, `npm run typecheck` e `npm run generate:map`.

## preSetup — massa que os testes não criam

Três coisas são criadas **uma vez só**, por `npm run pre-setup`, e nunca por um teste:

| O quê | Arquivo gerado | Por quê |
|---|---|---|
| Pool de clientes finais ativados | `preSetup/.endUsers.json` | `POST /auth/platform/public/activate` tem rate limit (429). Login não tem — os testes só logam. |
| Segundo tenant (isolamento) | `preSetup/.tenants.json` | Criar tenant por execução deixa lixo permanente na base. O passo é idempotente. |
| Admin sem `canViewSensitiveData` | `preSetup/.admins.json` | O admin principal enxerga todo dado sensível; sem um admin comum, nenhum caso de permissão LGPD é executável. |

Quantos clientes cada caso reserva fica em `data/endUsers.data.ts`; cada caso recebe uma
fatia exclusiva, então dois testes nunca dividem o mesmo cliente — o que mantém a suíte
correta em paralelo. Ler com `endUsersFor("AG-11")` (`core/src/utils/endUser.utils.ts`).

Sem o pré-setup, os casos `endUserAuth` falham com instrução explícita para rodá-lo.

## Retry só em leitura

Os services gerados aplicam `retry` **apenas em `GET`**. Repetir `POST`/`PUT`/`PATCH`/`DELETE`
reexecuta o efeito colateral: a primeira tentativa cria o recurso, a segunda esbarra no
conflito que ela mesma provocou, e o teste falha por um motivo inventado. Foi exatamente o que
aconteceu com a ativação de cliente (o retry estourou o rate limit) e com a restauração de
crédito (a segunda tentativa recebeu "crédito já devolvido").

Ao escrever um service à mão, manter a mesma regra.

## Limpeza de massa entre execuções

Cada caso nomeia os recursos que cria com o **prefixo do seu próprio ID** (`[AG-01]`), e o
`before` limpa só esse prefixo (`appointmentsBusiness.cleanupByPrefix`). Assim a limpeza de um
caso nunca alcança a massa de outro rodando em paralelo. Para agendamentos, a limpeza cancela
os do cliente na data (`cancelAppointmentsOfPerson`) — a cota de um por dia impediria a
segunda execução do mesmo caso no mesmo dia.

## DataBuilder é singleton — `build()` reseta

Os builders são instanciados uma vez em `@core/constants`, e o Mocha em paralelo roda
**vários arquivos de teste no mesmo processo** (10 jobs para 36 arquivos). Sem cuidado, um
`with...()` de um caso vaza para o caso seguinte do mesmo worker.

Por isso todo `build()`:

1. devolve uma **cópia** (`structuredClone`), não a referência interna;
2. **volta o builder ao estado inicial** (`defaults()` ou `reset()`).

Foi o que causou a instabilidade mais cara de diagnosticar do módulo de Agendamentos: o
`professionalSelectionMode: "required"` do caso `AG-13` vazava para `AG-17`, `AG-18` e `AG-22`,
que falhavam com `Selecione um profissional para continuar.` — um erro que o teste nunca pediu,
em execuções que variavam a cada rodada.

Ao criar um builder novo, seguir o mesmo padrão: `private static defaults()` + reset no `build()`.

## Estado global do tenant — um tenant por caso

Configuração que existe **uma vez por tenant** não pode ser escrita por dois casos em paralelo:
o segundo sobrescreve o primeiro. É o caso da marca (`brand_settings`, uma linha por tenant) e
da permissão de dados sensíveis.

`data/tenants.data.ts` reserva um tenant por caso (`tenantFor("MK-01")`), no mesmo modelo do
pool de clientes e do de admins. O `preSetup` cria cada um com admin próprio, de forma
idempotente.

Antes de escrever um caso novo, a pergunta é: **o que este teste escreve tem chave própria?**
Se a resposta for não — é linha única do tenant, ou uma flag global — o caso precisa do seu
próprio tenant.

## Um dia por caso

`data/testDates.data.ts` reserva **um dia exclusivo por caso** (`dateForCase("AG-18")`) e faixas
próprias para os casos que repetem a mesma disputa em datas diferentes (`datesForCase("AG-16")`).

Com isso a limpeza do `before` pode zerar **o dia inteiro**
(`appointmentsBusiness.cancelAllAppointmentsOnDate`), o que é imune a massa velha de qualquer
origem — e nenhum caso enxerga o que outro criou. Faixas ficam acima dos dias individuais de
propósito: uma faixa que atravessasse o dia de outro caso o contaminaria.

## Massa que não dá para apagar

Formulário com resposta e serviço com agendamento **não podem ser excluídos** — a limpeza por
prefixo recebe 409 e segue em frente de propósito. A consequência prática: contadores ligados a
uma pessoa (respostas, agendamentos) crescem a cada execução.

Por isso um caso nunca deve assertar total **por pessoa**. Ancore no recurso que o próprio caso
criou naquela execução: `GET /dashboard/forms/{id}/submissions` em vez de
`GET /dashboard/forms/submissions?personId=`, por exemplo. Foi o que estabilizou o `F-22`.

Pelo mesmo motivo, nunca compare um total global entre duas chamadas: o tenant é compartilhado
e outros casos criam massa entre uma e outra.

## Asserções que enganam

`assertTs.isNotNull` **passa quando o valor é `undefined`** — e campo ausente vem como
`undefined`, não `null`. Um teste que confere a existência de um campo com `isNotNull` fica
verde mesmo quando a API não devolve o campo. Usar `assertTs.exists`, que recusa os dois.

Foi assim que o `AG-21` quase passou apesar de o encadeamento do reagendamento não existir.

## Bug encontrado pela automação

Todo bug que a suíte encontrar vira issue no board de QA
(<https://github.com/users/pricaimiTech/projects/7/views/4>) — nunca só um comentário no código.

```bash
node scripts/abrir-bug.mjs --caso API-AG-05 \
  --titulo "Disponibilidade aceita regras sobrepostas" --arquivo corpo.md
```

O script cria a issue em `pricaimiTech/dev.CrossHub` (repo do produto, onde o commit da
correção fecha a issue), adiciona ao board e devolve o trecho pronto para colar em
`data/knownBugs.data.ts`. Requer `gh` com escopo `project`
(`gh auth refresh -s project --hostname github.com`).

Depois de abrir:

1. Registrar em `data/knownBugs.data.ts`, indexado pelo ID do caso (`"API-AG-05"`).
2. No `.data.ts` do caso: `knownBug: knownBugs["API-AG-05"]`.
3. No teste: `bugTag()` no título do `it` e `bugMessage()` na mensagem da asserção
   (`core/src/utils/bug.utils.ts`) — o número aparece no output do Mocha e no `xunit.xml`,
   e a URL aparece na falha.
4. `npm run generate:map` — o mapa ganha a coluna **Bug** e a seção "Bugs abertos".

**O teste continua vermelho de propósito.** Ele é fiel à especificação; fica verde quando a
API for corrigida, e é assim que a suíte avisa que a correção chegou. Não usar `it.skip`
nem inverter a asserção para o comportamento defeituoso.

### `specPactumJs()` e `IParamsDefault`

Todo service parte de `specPactumJs()` (`core/src/constants.ts`), que já condiciona o `.inspect()` à env `LOG`. Toda chamada segue o padrão `IParamsDefault` (`statusCode`, `retry.count`, `retry.delay`, `token?`, `tenantSlug?`), construído pelas fábricas `preSetup.preSetupParamsDefault200` / `preSetupParamsDefault` (`core/src/constants.ts`).

## Nomenclatura resumida (detalhes nas skills)

| Tipo      | Formato                                                  |
|-----------|-----------------------------------------------------------|
| Teste     | `[CÓDIGO]-E` ou `-F` + `.test.ts` — **um teste por arquivo** |
| Service   | `[verboHTTP][NomeEndpoint].service.ts`                     |
| Business  | `[dominio].business.ts`                                    |
| Data      | `[funcionalidade].data.ts`                                 |
| Interface | `I[Nome].interface.ts`                                     |

## Configuração e execução

### Tecnologias

- **Testes**: Mocha + TypeScript (`ts-mocha`)
- **HTTP**: PactumJS
- **Asserções / schemas**: Chai + Joi
- **Dados**: @faker-js/faker
- **Datas**: moment, moment-timezone
- **Relatórios**: mocha-junit-reporter, mocha-multi-reporters (`xunit.xml`)

### Scripts NPM úteis

```bash
npm run typecheck            # tsc --noEmit
npm run pre-setup            # roda preSetup/

npm run localTest            # todos os testes
npm run all-<dominio>        # tudo de um domínio       (ex.: all-auth)
npm run e2e-<dominio>        # só e2e do domínio        (ex.: e2e-billing)
npm run functional-<dominio> # só funcionais            (ex.: functional-people)
```

`GREP="texto" npm run localTest` filtra por nome de teste.

### Ambientes (`TEST_ENV`)

A suíte roda contra três ambientes: `localhost`, `develop` e `prod`. Cada um tem seu próprio arquivo `.env.<ambiente>` na raiz (não versionado — copiar do `.env.<ambiente>.example` correspondente). A variável `TEST_ENV` decide qual arquivo `core/src/env.ts` carrega; default é `localhost`.

```bash
npm run all-auth                              # usa .env.localhost (default)
cross-env TEST_ENV=develop npm run all-auth   # usa .env.develop
cross-env TEST_ENV=prod npm run all-auth      # usa .env.prod
```

Faltando o `.env.<ambiente>` correspondente, ou um `TEST_ENV` desconhecido, a suíte falha rápido com um erro explicando o que fazer.

### Execução local (exemplo)

```bash
npm install
cp .env.localhost.example .env.localhost   # preencher BASE_URL e credenciais
npm run all-auth
cross-env LOG=true npm run e2e-billing
```

## Aliases de import

| Alias | Aponta para |
|---|---|
| `@core/*` e `@core/{services,business,builders,interfaces,data,utils}/*` | `core/src/...` |
| `@app/constants` | `constants.ts` da raiz |
| `@shared-data/*` | `data/*` |
| `@preSetup/*` | `preSetup/*` |
| `@<dominio>/*`, `@<dominio>-data/*`, `@<dominio>-tests/*` | pastas do domínio |

Resolvidos em build pelo `tsconfig.json` e em runtime pelo `tsconfig-paths/register` carregado no `.mocharc.js`.

### TypeScript

- Target ES2022, module/moduleResolution `nodenext`, `strict`, types `node` e `mocha`
- Sem linter configurado no projeto (não há Biome/ESLint) — seguir o estilo já usado no arquivo vizinho

## Skills de implementação (`.claude/`)

Use a skill correspondente ao criar ou revisar código:

| Skill                    | Conteúdo                          |
|--------------------------|------------------------------------|
| `create-data`            | Arquivos `.data.ts`                |
| `create-test-e2e`        | Testes `-E.test.ts`                |
| `create-test-functional` | Testes `-F.test.ts`                |
| `create-builder`         | DataBuilders no core                |
| `create-service`         | Serviços Pactum                     |
| `create-business`        | Classes business                    |
| `create-interface`       | Interfaces `I*.interface.ts`        |
| `create-utils`           | Funções em `*.utils.ts`             |
| `api-test-planner`       | Mapeia endpoints pelo navegador e gera plano em `docs/plans/` |

> `create-service` e `create-interface` descrevem o padrão do código gerado — use-as para revisar a saída do gerador ou para escrever um service à mão fora do contrato.

Regras transversais (sem `any` em testes, Triple-A, cleanup no `before`, serviços só com curl, JSDoc em services, etc.) estão consolidadas nessas skills para evitar duplicação com este arquivo.
