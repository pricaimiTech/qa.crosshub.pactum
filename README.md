# qa.crosshub.pactum

Automação de testes de API do CrossHub com **Pactum + Mocha + TypeScript**.

## Setup

```bash
npm install
cp .env.localhost.example .env.localhost   # preencher BASE_URL e credenciais
cp .env.develop.example .env.develop
cp .env.prod.example .env.prod
```

## Ambientes

A suíte roda contra três ambientes: `localhost`, `develop` e `prod`. Cada um
tem seu próprio arquivo `.env.<ambiente>` na raiz (não versionado — copiar do
`.env.<ambiente>.example` correspondente). A variável `TEST_ENV` decide qual
arquivo é carregado (`core/src/env.ts`); default é `localhost`.

```bash
npm run all-auth                              # usa .env.localhost (default)
cross-env TEST_ENV=develop npm run all-auth   # usa .env.develop
cross-env TEST_ENV=prod npm run all-auth      # usa .env.prod
```

Faltando o arquivo `.env.<ambiente>` correspondente, ou um `TEST_ENV`
desconhecido, a suíte falha rápido com um erro explicando o que fazer.

## Estratégias de teste

Este repo é o dono dos documentos de estratégia. A **implementação** dos testes
unitários, de integração e de componente vive em `../dev.CrossHub/__tests__/`.

```
.doc/
├── dashboard/
│   ├── estrategia-testes-dashboard.html   # a fonte — editar aqui
│   ├── estrategia-testes-dashboard.json   # artefato de build
│   └── build-strategy-json.mjs            # gera o .json a partir do HTML
└── admin/
    └── estrategia-testes-admin.md
```

Rastreabilidade, nos dois sentidos, com reprovação quando um caso P0 fica sem
teste:

```bash
npm run generate:map        # tudo: JSON + carimbo + mapa de API + mapa unitário
npm run generate:unit-map   # só a camada unitária
```

O mapa unitário casa caso e teste pelo **ID citado no `describe`** dos specs de
`../dev.CrossHub/__tests__/unit/**` — não pelo nome do arquivo, porque lá um
arquivo cobre vários casos. Aponte outra árvore com `CROSSHUB_DEV_ROOT` ou com
um argumento de CLI; sem a clonagem irmã o portão pula com aviso, e com
`--exigir` (o modo do CI) reprova.

## Estrutura

```
core/src/            # código compartilhado
  constants.ts       # specPactumJs() e storage
  services/          # chamadas HTTP (*.service.ts)
  business/          # fluxos reutilizáveis (*.business.ts)
  dataBuilder/       # builders fluentes de payload
  interface/         # I*.interface.ts
  data/              # api.data.ts, paramsDefault.data.ts
  utils/             # helpers puros
data/                # dados compartilhados entre domínios
preSetup/            # login e massa executados antes da suíte
<dominio>/           # um por módulo da API (auth, people, billing, ...)
  data/              # *.data.ts do domínio
  tests/e2e/         # [CODIGO]-E.test.ts
  tests/functional/  # [CODIGO]-F.test.ts
```

Domínios: `addons`, `appointments`, `audit`, `auth`, `banners`, `billing`,
`branding`, `catalog`, `dashboard`, `forms`, `groups`, `people`, `plans`,
`privacy`, `tenants` — espelhando os módulos de `apps/api/src` do CrossHub.

## Aliases de import

| Alias | Aponta para |
|---|---|
| `@core/*` e `@core/{services,business,builders,interfaces,data,utils}/*` | `core/src/...` |
| `@app/constants` | `constants.ts` da raiz |
| `@shared-data/*` | `data/*` |
| `@preSetup/*` | `preSetup/*` |
| `@<dominio>/*`, `@<dominio>-data/*`, `@<dominio>-tests/*` | pastas do domínio |

Resolvidos em build pelo `tsconfig.json` e em runtime pelo `tsconfig-paths/register`
carregado no `.mocharc.js`.

## Scripts

```bash
npm run typecheck          # tsc --noEmit
npm run pre-setup          # roda preSetup/
npm run localTest          # todos os testes
npm run all-<dominio>       # tudo de um domínio      (ex.: all-auth)
npm run e2e-<dominio>       # só e2e do domínio       (ex.: e2e-billing)
npm run functional-<dominio> # só funcionais          (ex.: functional-people)
```

```bash
npm run generate:strategy   # HTML da estratégia -> .json
npm run stamp:strategy      # carimba o estado de automação de cada caso no HTML
npm run generate:map        # os dois acima + mapa de API + mapa unitário
npm run generate:unit-map   # só o mapa da camada unitária
```

`GREP="texto" npm run localTest` filtra por nome de teste.

## Skills (`.claude/`)

Padrões de código do projeto, usados pelo Claude Code ao gerar arquivos:
`create-service`, `create-business`, `create-builder`, `create-interface`,
`create-data`, `create-utils`, `create-test-e2e`, `create-test-functional`
e `api-test-planner` (mapeia endpoints pelo navegador e gera plano em `docs/plans/`).

Referências vivas que as skills apontam:
`core/src/services/auth/postTenantLogin.service.ts`,
`core/src/business/auth/auth.business.ts`,
`core/src/data/api.data.ts` (prefixos reais das rotas do Nest).
