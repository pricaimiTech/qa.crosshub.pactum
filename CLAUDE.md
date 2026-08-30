# Documentação da Arquitetura — Projeto QA CrossHub API

Visão geral do repositório e referência rápida. **Padrões de implementação por tipo de arquivo** estão nas skills em `.claude/` (ex.: `create-data`, `create-test-e2e`, `create-service`).

## Estrutura geral

### Organização

- **Domínios da API** (um por módulo, espelhando `apps/api/src` do CrossHub): `addons`, `appointments`, `audit`, `auth`, `banners`, `billing`, `branding`, `catalog`, `dashboard`, `forms`, `groups`, `people`, `plans`, `privacy`, `tenants`
- **Core compartilhado**: `core/src` (services, interfaces, dataBuilder, utils, business, constants)
- **Setup prévio**: `preSetup/` — login e massa de dados executados antes da suíte
- **Dados compartilhados entre domínios**: `data/`
- **Configuração**: `.env.<ambiente>`, `constants.ts` (raiz), `package.json`, `.mocharc.js`, `tsconfig.json`

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
  dashboardPrivacy: "/dashboard/privacy",
  public: "/public",
  publicTenants: "/public/tenants",
  assets: "/assets",
  health: "/health",
}
```

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

Regras transversais (sem `any` em testes, Triple-A, cleanup no `before`, serviços só com curl, JSDoc em services, etc.) estão consolidadas nessas skills para evitar duplicação com este arquivo.
