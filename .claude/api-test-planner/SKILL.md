---
name: api-test-planner
description: Usa o Chrome DevTools para abrir o navegador, executar um fluxo web passo a passo e capturar os endpoints de API relevantes em cada ação. Ao final, verifica testes já existentes no projeto, mapeia os endpoints, sugere apenas cenários novos e gera um plano de desenvolvimento salvo como arquivo .md. Use esta skill SEMPRE que o usuário quiser: abrir um navegador para mapear endpoints, executar ações na tela para descobrir quais requests são feitos, explorar um fluxo web para criar testes automatizados, ou quando mencionar "abrir o navegador", "mapear endpoints", "explorar a tela", "quais requests são feitos nesse fluxo", "planejar testes a partir da navegação", ou qualquer variação de descobrir endpoints via browser para criar testes de API.
---

# API Test Planner

Executa um fluxo web no navegador usando **exclusivamente Chrome DevTools** (que permite interação E captura de rede na mesma sessão), captura endpoints de API relevantes por passo, verifica testes já existentes no projeto e gera um plano de desenvolvimento salvo como `.md`.

## Fase 1 — Receber e confirmar os passos

Antes de abrir o navegador, confirme com o usuário:

- URL inicial
- Lista de passos a executar
- Dados necessários (credenciais, nomes, valores)

Se algum dado estiver faltando, pergunte antes de começar.

## Fase 2 — Executar o fluxo e capturar endpoints

### Abrir o navegador

Use exclusivamente Chrome DevTools — ele captura rede e interage com a página na mesma sessão:

``` text
mcp__chrome-devtools__new_page(url)        → abre nova aba na URL
mcp__chrome-devtools__take_snapshot()      → obtém UIDs dos elementos para interação
mcp__chrome-devtools__take_screenshot()    → confirma estado visual da tela
```

> **Não usar Vibium** — o Vibium abre um browser separado do Chrome DevTools, impossibilitando a captura de rede.

### Para cada passo

Execute esta sequência:

**1. Screenshot antes** — `mcp__chrome-devtools__take_screenshot` para confirmar o estado atual.

**2. Snapshot de acessibilidade** — `mcp__chrome-devtools__take_snapshot` para obter os UIDs dos elementos.

**3. Executar a ação** — use as ferramentas do Chrome DevTools conforme o tipo:

- Navegar para URL: `mcp__chrome-devtools__navigate_page`
- Clicar: `mcp__chrome-devtools__click` (requer `uid` do snapshot)
- Preencher campo: `mcp__chrome-devtools__fill` (requer `uid` do snapshot)
- Localizar elemento via JS: `mcp__chrome-devtools__evaluate_script` (quando o uid não está disponível no snapshot)

**4. Capturar requests** — após a ação, use `mcp__chrome-devtools__list_network_requests` filtrando apenas `["xhr", "fetch"]`.

**5. Filtrar — manter apenas requests relevantes ao passo:**

Ignorar completamente:

- Arquivos estáticos: `.css`, `.js`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.woff`, `.woff2`, `.ttf`, `.map`
- Domínios de terceiros: google-analytics, clarity.ms, amplitude, getbeamer, getsitecontrol, CDNs
- Requests de health check, heartbeat, polling genérico

Manter apenas:

- Requests para o backend da aplicação cujo endpoint tem relação direta com a ação executada
- Exemplo: passo "criar estoque" → manter só requests de criação, ignorar carregamentos de menu/notificações

**6. Extrair curl de cada request relevante** — use `mcp__chrome-devtools__get_network_request` com o `reqid` e monte o curl:

```bash
curl -X [MÉTODO] '[URL]' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer [AUTH_TOKEN]' \
  -d '{ ... body REST direto ... }'
```

> A API do CrossHub é **REST (NestJS)** — o body é o JSON do recurso, sem envelope
> `{ args, name, version }`. Rotas autenticadas usam **Bearer token**.

Regras:

- Incluir headers relevantes para a API (Content-Type, Authorization se presente)
- Omitir headers internos do browser (sec-fetch-*, cache-control, user-agent, etc.)
- Substituir tokens reais por `[AUTH_TOKEN]`
- Incluir o body completo — é a fonte oficial para implementação do service

**7. Registrar para este passo:**

``` text
### Passo N: [descrição]
- [MÉTODO] /caminho/endpoint → [status]
  Response relevante: { campos úteis para o teste }

  curl:
  curl -X [MÉTODO] '[URL_COMPLETA]' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer [AUTH_TOKEN]' \
    -d '{ ... }'
```

**8. Screenshot depois** — confirma visualmente que a ação foi executada.

### Se um passo falhar

Tire screenshot, descreva o problema e pergunte ao usuário como proceder antes de continuar.

### Dica: encontrar URLs de seções do menu

Quando o menu lateral usa ícones sem texto, use JavaScript para descobrir os links disponíveis:

```javascript
mcp__chrome-devtools__evaluate_script:
() => Array.from(document.querySelectorAll('a[href]'))
  .filter(a => a.href.includes('[palavra-chave]'))
  .map(a => ({ href: a.href, text: a.innerText.trim() }))
```

## Fase 3 — Consolidação

Após todos os passos, apresente um resumo estruturado:

``` text
## Endpoints Capturados por Passo

### Passo 1: [descrição]
- POST /auth/platform/tenant/login → 200
  curl -X POST '[BASE_URL]/auth/platform/tenant/login' \
    -H 'Content-Type: application/json' \
    -d '{ "slug": "...", "email": "...", "password": "..." }'

### Passo 2: [descrição]
- POST /dashboard/people → 400
  curl -X POST '[BASE_URL]/dashboard/people' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer [AUTH_TOKEN]' \
    -d '{ "name": " ", "email": "..." }'

## Endpoints Únicos Identificados
| Método | Endpoint | Domínio | Finalidade |
|--------|----------|---------|------------|
| POST   | /auth/platform/tenant/login | auth | Autenticação do admin do tenant |
| POST   | /dashboard/people | people | Criação de pessoa |
```

## Fase 4 — Verificação de testes existentes

Antes de sugerir cenários adicionais, **pesquise no projeto** os testes já existentes para os endpoints capturados:

``` text
Grep por: [NomeEndpoint] em [dominio]/tests/ — domínios: addons, appointments, audit,
auth, banners, billing, branding, catalog, dashboard, forms, groups, people, plans,
privacy, tenants
Glob por: **/*.test.ts nos domínios relevantes
```

Apresente o resultado:

``` text
## Testes já existentes para estes endpoints
- postCreatePerson → CH-1234-E.test.ts (criação com sucesso)
- postTenantLogin → usado como pré-condição em vários testes
```

Use esta informação para **não sugerir cenários que já estão cobertos**.

## Fase 5 — Mapeamento para padrões do projeto

Para cada endpoint, identifique:

**Domínio** — com base no prefixo da URL (ver `core/src/data/api.data.ts`):

- `/auth/platform` → `auth`
- `/admin/tenants` → `tenants` · `/admin/plans` → `plans` · `/admin/billing` → `billing` · `/admin/add-ons` → `addons`
- `/dashboard/people` → `people` · `/dashboard/groups` → `groups` · `/dashboard/forms` → `forms`
- `/dashboard/appointments` → `appointments` · `/dashboard/banners` → `banners`
- `/dashboard/branding` → `branding` · `/dashboard/privacy` → `privacy`
- `/dashboard` (raiz) → `dashboard` · `/dashboard/catalog*` → `catalog`
- `/public`, `/public/tenants` → domínio correspondente ao recurso público (`catalog`, `forms`, `tenants`, `appointments`)

Se o prefixo capturado não estiver em `api.data.ts`, adicione-o lá antes de criar o service.

**Arquivos a criar** — verifique se já existem antes de sugerir:

- Service: `[verboHTTP][NomeEndpoint].service.ts`
  - Localização: `core/src/services/[dominio]/[contexto]/`
- Interface: `I[Nome].interface.ts` em `core/src/interface/[dominio]/`
- DataBuilder: `[nome].dataBuilder.ts` (verificar em `core/src/dataBuilder/`)

**Estrutura padrão de request:**

```typescript
specPactumJs()
  .post(`${process.env.BASE_URL}${apiName.dashboardPeople}`)
  .withBearerToken(`${paramsDefault.token}`)
  .withJson({ /* body REST do recurso */ })
```

## Fase 6 — Plano de testes

### A) Cenário principal (o que foi executado)

Apresente o teste correspondente ao fluxo capturado com tipo correto:

- Validação de erro de negócio / resposta 4xx → `-F.test.ts` (Functional)
- Fluxo completo ponta a ponta → `-E.test.ts` (E2E)

``` text
**Código ClickUp**: [a ser preenchido pelo usuário]
**Arquivo**: [CODIGO-CLICKUP]-[F/E/C].test.ts
**Tipo**: [Functional / E2E / Contract]
**Descrição**: [descrição do fluxo]

Before: [passos de setup — login via business, busca de IDs, cleanup se necessário]
It: [ação principal com statusCode esperado]
Asserts: [lista de validações]
```

### B) Cenários adicionais sugeridos

Sugira **apenas cenários que ainda não existem no projeto** (verificado na Fase 4):

- Cenários de erro complementares (400, 401, 403, 404, 409)
- Variações do fluxo ainda não cobertas
- Testes funcionais para outras regras de negócio do mesmo endpoint

Apresente os cenários numerados e pergunte:
**"Quais desses cenários adicionais você quer incluir no plano de desenvolvimento?"**

Aguarde a resposta antes de gerar o plano final.

### C) Gerar e salvar o plano como arquivo .md

Após confirmação do usuário, gere o plano e **salve como arquivo**:

**Localização**: `docs/plans/[CODIGO-CLICKUP]-plan.md`
Se o arquivo já existir, **atualize-o** em vez de criar um novo.

Estrutura do arquivo:

```markdown
# Plano de Desenvolvimento — [Nome do Fluxo]
**Data**: [data atual]
**Domínio**: [domínio(s) envolvido(s)]

---

## 1. Interfaces TypeScript a Criar

### core/src/interface/[dominio]/[contexto]/
- `I[Nome].interface.ts`
  - Campos: [lista dos campos do request/response derivados do curl]

---

## 2. DataBuilders a Criar

### core/src/dataBuilder/[dominio]/[contexto]/
- `[nome].dataBuilder.ts`
  - Campos iniciais: [lista]
  - Métodos with*: [lista]

> **Atenção**: Instanciar em `core/src/constants.ts` — nunca instanciar diretamente no arquivo de teste.

---

## 3. Services a Criar

### core/src/services/[dominio]/[contexto]/
- `post[NomeEndpoint].service.ts`
  - Endpoint: POST /[prefixo]/[recurso]
  - Parâmetros: [lista derivada do curl]
  - Body: JSON REST direto em `.withJson({ ... })`
  - Auth: `.withBearerToken()` quando a rota for autenticada
  - JSDoc: obrigatório
  - **Curl de referência**:
    ```bash
    [curl completo capturado]
    ```

---

## 4. Testes a Criar

### [dominio]/tests/[functional|e2e]/[contexto]/

#### [CODIGO-CLICKUP]-[F/E/C].test.ts — [descrição]
- **Before**: [passos de setup e cleanup]
- **It**: [ação principal]
- **Asserts**: [lista de validações com mensagens]
- **Data file**: [contexto].data.ts

[repetir para cada cenário confirmado]

---

## 5. Data Files a Criar

### [dominio]/data/
- `[contexto].data.ts`
  - Campos: [lista com valores sugeridos]
  - paramsDefault: incluído no objeto

---

## 6. Ordem de Implementação

1. Criar interfaces TypeScript
2. Criar DataBuilders + instanciar no constants.ts
3. Criar services (com JSDoc)
4. Criar data files
5. Criar test files

---

## 7. Regras Críticas para Implementação

- UM TESTE POR ARQUIVO
- Sem `for`, sem `if` nos arquivos `.test.ts`
- Triple-A obrigatório: Arrange → Act → Assert (sem chamadas de API após asserts; asserts só nas linhas finais do `it`)
- Proibido asserts (`assertTs`, `expect`, Chai) em `before` / `beforeEach` — apenas Arrange; asserts somente no `it`
- Cleanup no `before`, NUNCA no `after`
- Login e condicionais (`if`/`for`) em `core/src/business/`, nunca no `.test.ts`
- Tipagem obrigatória: sem `any`, usar interfaces; arrays como `Array<string>`
- Todos os parâmetros via arquivo `.data.ts`
- JSDoc obrigatório em todos os services
```

Após salvar, informe o caminho do arquivo criado/atualizado.

> **Este plano é autocontido** — pode ser passado para outro contexto para implementação sem informações adicionais.

## Referência rápida — Ferramentas Chrome DevTools

| **Ação**                    | **Ferramenta**                                                                       |
|-----------------------------|--------------------------------------------------------------------------------------|
| Abrir nova aba              | `mcp__chrome-devtools__new_page`                                                     |
| Navegar para URL            | `mcp__chrome-devtools__navigate_page`                                                |
| Snapshot de acessibilidade  | `mcp__chrome-devtools__take_snapshot`                                                |
| Screenshot                  | `mcp__chrome-devtools__take_screenshot`                                              |
| Clicar em elemento          | `mcp__chrome-devtools__click` (usa `uid` do snapshot)                                |
| Preencher campo             | `mcp__chrome-devtools__fill` (usa `uid` do snapshot)                                 |
| Executar JavaScript         | `mcp__chrome-devtools__evaluate_script`                                              |
| Listar requests de rede     | `mcp__chrome-devtools__list_network_requests`<br/>(`resourceTypes: ["xhr","fetch"]`) |
| Detalhar request            | `mcp__chrome-devtools__get_network_request` (com `reqid`)                            |
| Selecionar página           | `mcp__chrome-devtools__select_page`                                                  |
| Listar páginas abertas      | `mcp__chrome-devtools__list_pages`                                                   |
