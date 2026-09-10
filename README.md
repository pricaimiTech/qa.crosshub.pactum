# qa.crosshub.pactum

Automação de testes de API do CrossHub com **Pactum + Mocha + TypeScript**.

## Setup

```bash
npm install
cp .env.localhost.example .env.localhost   # preencher BASE_URL e credenciais
cp .env.develop.example .env.develop
cp .env.prod.example .env.prod
```

Além das credenciais de acesso, cada `.env.<ambiente>` precisa de
`POOL_PASSWORD`: é a senha das contas descartáveis que o `pre-setup` cria
(pools de admins, segundo tenant, tenant vazio e tenants por caso). Mínimo de
12 caracteres, exigido pelo `ResetTenantAdminPasswordDto` da API. Fica no
ambiente, e não em `data/`, porque este repositório é público. Como o
`pre-setup` redefine a senha dessas contas a cada execução, trocar o valor é
só rodar `npm run pre-setup` de novo.

### Rotas de apoio da API (só localhost)

Os casos que precisam de precondição impossível pela API normal — "reserva
criada há 25 h", "resposta sensível de 31 dias" — usam
`POST /dashboard/test-fixtures/backdate`. O módulo dessa rota só é registrado
com `TEST_FIXTURES_ENABLED=true`, e a decisão acontece **em tempo de import do
`AppModule`**, antes de a API carregar o próprio `.env`. Ou seja: a variável
precisa estar no ambiente do processo, não basta o arquivo.

```bash
TEST_FIXTURES_ENABLED=true pnpm --filter @crosshub/api dev
```

Sem isso, `H-01`, `H-02`, `H-09` e `LGPD-11` caem com `404 Cannot POST`.

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

### Paralelismo e o limite de login (#133)

O `.mocharc.js` escolhe o número de workers pelo ambiente: 4 no CI, **2 em
`develop`** e 10 no localhost. `JOBS` sobrepõe (`JOBS=6 cross-env
TEST_ENV=develop ...`).

`develop` roda mais devagar porque o login do cliente final tem limite de
tentativas, e ele é compartilhado por todo mundo que sai do mesmo IP — o
runner inteiro. Desde a correção do #133 os limites são:

| Balde | Limite (janela de 60s) |
| --- | --- |
| Conta (`slug` + e-mail) | 5 tentativas |
| IP (`ip` + `slug`) | 30 falhas |

Um login bem-sucedido zera o balde da conta. O do IP só conta falhas e só
vence com o tempo, então **uma onda de 401 vira uma onda de 429** um instante
depois: se muitos casos caírem no `before` com

```
O status code da requisição POST /auth/platform/public/login não é o esperado.
HTTP status 429 !== 200
```

o 429 é consequência, não causa. Procure o que estava gerando 401 antes dele —
quase sempre o pool `preSetup/.endUsers.json` de outro ambiente (ver
[Pools do pre-setup](#pools-do-pre-setup)).

Voltar `develop` a 10 workers é seguro assim que a correção do #133 estiver
publicada lá; o sinal de que deu certo é a suíte passar sem 429 nenhum.

### Pools do pre-setup

`npm run pre-setup` grava a massa reservada em `preSetup/.*.json` (tenants,
admins, clientes finais). **Esses arquivos são por ambiente e não carregam
qual ambiente os gerou.** O de clientes finais, `.endUsers.json`, ainda é
incremental: rodando o pre-setup em `develop` com um arquivo do localhost na
pasta, ele reaproveita pessoas que não existem lá, e todo caso `endUserAuth`
cai com 401 — que vira 429 logo em seguida, pelo limite acima.

Ao trocar de ambiente, apague ou mova os pools antes:

```bash
mv preSetup/.endUsers.json preSetup/.endUsers.localhost.json
cross-env TEST_ENV=develop npm run pre-setup
```

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
