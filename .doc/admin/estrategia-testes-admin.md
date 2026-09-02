# Estratégia de Testes para Homologação do Admin

> **Escopo:** `apps/admin` (Super Admin, porta 3002) e rotas `admin/*` da API
> **Base:** `develop @ c157475` · 23/08/2026 · Autora: Priscila Caimi
> **Método de priorização:** heurística RCRCRC (James Bach)

Plano de cobertura em três camadas — unitário, integração e E2E — para homologar o app admin após a migração completa para o design system (Fase 0 + Fase 1, PRs #70–#75).

---

## 1. Situação atual

| Indicador | Valor |
|---|---|
| Cobertura de teste no frontend do admin | **0%** (nenhum runner instalado — o script `test` é um placeholder `node --test` que passa vazio) |
| Arquivos de teste no repositório | **2** (API: fuso de agendas + RLS) — nenhum toca rotas `admin/*` |
| Endpoints `admin/*` consumidos pelo frontend | **14**, todos sem teste de contrato |
| Código recém-migrado | ~3.500 linhas em 6 client components (Recent = risco máximo de regressão) |

O admin é uma **SPA de rota única**: a navegação é um estado `screen` (`list | create | detail | plans | create-plan | edit-plan | billing`) dentro de `admin-console.tsx`, sem URLs. Consequência direta para E2E: **não há deep-link — todo cenário parte do login** e navega por clique. Autenticação por JWT de plataforma (role `platform_admin`, expira em 15 min, sem refresh) guardado em `sessionStorage`.

### Defeitos e gaps encontrados na análise (tratar antes/durante a homologação)

| Prio | Achado |
|---|---|
| **P0** | **Campo fantasma `adminLimit`:** editável em `plan-form.tsx` e enviado no payload, mas **não existe** na tabela `plans`, no controller nem no service da API. A coluna "Admins" da listagem sempre exibe "Ilimitado". Decidir: implementar no backend ou remover do form. |
| **P0** | **Criação de cliente não transacional:** o wizard faz `POST /admin/tenants` e depois `POST /admin/tenants/:id/admins`. Se a 2ª falha, fica um **tenant órfão sem admin** (a UI só avisa). |
| **P1** | **Campos do wizard descartados no submit:** `customDomain`, `internalNotes` e `initialStatus='setup'` (vira `'inactive'`) não têm destino na API — o usuário preenche e o dado se perde. |
| **P1** | **Logout por heurística de string:** `loadTenants` chama `signOut()` quando a mensagem de erro contém a substring `'carregar'` (`admin-console.tsx:202`) — frágil e propenso a deslogar por engano. |
| **P1** | **Preços de add-ons hardcoded no frontend** (29/39/49 em `MODULE_META`): o total estimado do wizard pode divergir do que a API/billing considera. |
| **P2** | **Senha temporária efêmera:** só existe no modal pós-criação; fechar o modal a perde para sempre (sem reenvio por e-mail). |
| **P2** | **Sessão de 15 min sem refresh:** qualquer fluxo longo (wizard) pode expirar no meio; o comportamento não é tratado explicitamente. |

---

## 2. Priorização de risco — RCRCRC

| Dimensão | Áreas identificadas no admin | Peso |
|---|---|---|
| **Recent** | Toda a migração ao design system: wizard (992→813 linhas), `plan-form`, console (903 linhas alteradas), `tenant-detail-view` (1.094), fix de cascata CSS (`@layer base`). Regressão visual e funcional em todas as telas. Inclui o bug corrigido do `onNotice` (mensagens de planos/billing eram descartadas em silêncio) — precisa de teste de regressão. | Alto |
| **Core** | Login de plataforma, criação de cliente (é o onboarding do negócio — sem ele não entra tenant novo), gestão de planos (define o que cada cliente pode usar). | Alto |
| **Risky** | Criação tenant+admin não transacional; entrega de senha temporária; signOut por substring; campo fantasma `adminLimit`; operações irreversíveis (suspender cliente, resetar senha). | Alto |
| **Configuration-sensitive** | `NEXT_PUBLIC_API_URL` (fallback localhost:3001 — validar em staging/prod); módulos habilitados por plano (set fechado de 6 módulos); `sessionStorage` vs múltiplas abas; formato de preço pt-BR. | Médio |
| **Conformance** | LGPD: dados pessoais de admins (nome, e-mail, telefone) e senha temporária exposta em tela/clipboard; contrato das rotas `admin/*` (validação vive nos controllers, sem teste); acessibilidade após a troca de toda a UI (foco, navegação por teclado no wizard e modais). | Médio |
| **Complex** | Wizard de 4 passos com validação derivada por passo; conversão de preço pt-BR → centavos (`parsePriceInput`); interação plano × add-ons (`selectPlan` sobrescreve `enabledModules`); filtros + paginação client-side com reset de página. | Médio |

**Cruzamento das dimensões:** o wizard de criação de cliente é simultaneamente Recent, Core, Risky e Complex — é a área nº 1 de investimento de teste em todas as camadas.

---

## 3. A pirâmide proposta

```
        ┌──────────────────────────┐
        │   E2E · Playwright       │  ~8 jornadas (smoke de homologação)
      ┌─┴──────────────────────────┴─┐
      │ Integração · Supertest (API) │  ~25 cenários de contrato
      │        + RTL/MSW (UI)        │  e componente
    ┌─┴──────────────────────────────┴─┐
    │ Unitário · Vitest (front)        │  ~40 casos sobre funções
    │           + Jest (API)           │  puras e validações
    └──────────────────────────────────┘
```

### Pré-requisitos de infraestrutura (nada disso existe hoje)

- **Frontend unitário/integração:** instalar `vitest + @testing-library/react + jsdom + msw` em `apps/admin`. Vitest se alinha melhor com o monorepo Next 15/React 19 do que duplicar o Jest da API.
- **Refatoração habilitadora:** as funções puras (`slugify`, `parsePriceInput`, validações de passo…) são module-local dentro de arquivos `'use client'` de 400–900 linhas e **não são exportadas**. Extraí-las para `apps/admin/lib/` é pré-requisito da camada unitária — e reduz a duplicação já existente (`slugify` está copiada em dois arquivos).
- **API integração:** adicionar `supertest` ao `apps/api` (Jest + `@nestjs/testing` + Postgres no CI já existem).
- **E2E:** instalar `@playwright/test` na raiz (o `playwright` de `packages/ui` é só para auditoria visual de tokens). Seeds: um `platform_user` ativo e ao menos 1 plano ativo no banco de teste.

---

## 4. Camada unitária (Vitest / Jest)

Objetivo: travar a lógica pura que hoje só é exercitada manualmente. Rápidos, rodam em todo commit.

### 4.1 Frontend (após extração para `lib/`)

| Alvo | Casos essenciais | Prio |
|---|---|---|
| `slugify()` | Remove diacríticos ("São Paulo" → `sao-paulo`); colapsa não-alfanuméricos em hífen; trunca em 40; não gera hífen nas pontas; string vazia. | P0 |
| Validações do wizard (`stepOneValid`…`stepThreeValid`) | Slug: regex `^[a-z0-9-]+$`, mínimo 2 chars, colisão com `existingSlugs`; e-mail: regex aceita/rejeita casos-limite; senha: exatamente 12 chars passa, 11 falha; passo 3 exige plano **e** ≥1 módulo. | P0 |
| `parsePriceInput()` / `formatPriceInput()` | "1.234,56" → 123456 centavos; "0,01" → 1; vazio → null ("Sob consulta"); arredondamento de `Math.round`; round-trip parse→format estável. | P0 |
| `generateTemporaryPassword()` | Comprimento 16; contém ≥1 minúscula, maiúscula, dígito e símbolo de `!@#$%&*`; sempre passa na própria validação de 12+ chars. | P1 |
| `readTokenEmail()` | Extrai e-mail de JWT válido; retorna fallback seguro para token malformado/sem payload (não pode quebrar a tela de login). | P1 |
| Utilitários de exibição | `formatCurrency`, `planLabel`, `tenantInitials`, `isCreatedThisMonth/LastMonth` (fronteiras de mês — virada de ano). | P2 |

### 4.2 Backend (Jest já instalado)

- **P0** — `validateCreate/validateUpdate` de `admin-tenants.controller.ts` e `validate()` de `admin-plans.controller.ts`: slug, senha ≥12, set fechado de módulos (`branding, banners, shop, people, access_codes, quiz`), `currency /^[A-Za-z]{3}$/`, `priceCents` inteiro ≥0 ou null, `sortOrder` ≥0. Payloads com campos extras (ex.: `adminLimit`) devem ser rejeitados ou explicitamente ignorados — documentar o contrato.
- **P0** — `PlatformAuthService.validateAccessToken`: rejeita role ≠ `platform_admin`; rejeita usuário com `isActive=false` mesmo com JWT válido; expiração de 15 min.
- **P1** — `TenantAuthService.createAdmin`: primeiro admin do tenant recebe `isPrimaryAdmin=true` e `canViewSensitiveData=true`; os seguintes não.

### 4.3 Status da implementação (23/08/2026)

Camada unitária **implementada e verde no CI** (`pnpm test` via turbo): 74 casos Vitest em `__tests__/unit/front/admin/**/*.test.ts` + 44 casos Jest em `__tests__/unit/api/**/*.spec.ts`. Os arquivos de teste saíram de `apps/admin/lib/` e `apps/admin/tests/` para `__tests__/` em 02/09/2026 — ver `__tests__/README.md`; as funções sob teste continuam em `apps/admin/lib/`. Refatoração habilitadora concluída: funções puras extraídas para `apps/admin/lib/` (slugify, wizard-validation, price, money, password, token, display, dates, modules), com **todas as duplicações consolidadas** (slugify ×2, tenantInitials ×2, avatarTone ×2, formatDate ×2, adminDisplayName ×2, 4 variantes de formatação monetária, 2 geradores de senha, MODULE_META ×4 — dados puros em `lib/modules.ts`, ícones em `app/module-icons.ts`).

**Correções aplicadas junto com a extração** (cada uma coberta por teste nominal):
- `slugify` não termina mais em hífen após truncar em 40 chars (trim movido para depois do `slice`). O suposto bug do `ç` não se reproduz: NFD decompõe `ç` em `c`+U+0327, removido pelo regex — travado por teste.
- `parsePriceInput` aceita espaço, NBSP e NNBSP como separador de milhar → round-trip `parse(format(x))` estável em qualquer ICU.
- Gerador de senha único (`lib/password.ts`): garantia de 4 classes + Fisher-Yates (do wizard) com alfabeto sem ambíguos I/l/O/0/1 (do tenant-detail); a variante fraca `generatePassword` foi eliminada.
- `readTokenEmail` suporta base64url (`-`/`_`, sem padding) — o formato real de JWT.
- `adminDisplayName` unificada (aceita `string | null | undefined` com fallback configurável).
- `isCreatedThisMonth`/`isCreatedLastMonth`/`billingStartLabel` recebem `now: Date` injetável (default `new Date()`).

**Dívidas de comportamento** (documentadas nos testes como contrato vigente, sem correção neste ciclo):
- Senha do wizard e do backend validam **apenas comprimento ≥12** (sem exigir classes) — coerentes entre si; endurecer exige mudança coordenada.
- `enabledModules` de tenants **não valida contra o set de módulos** (diferente de `admin/plans`, que valida e deduplica).
- `currency` aceita 3 letras em qualquer caixa sem normalizar (`brl` passa e é persistido como veio).
- `admin/plans.validate` não faz trim no `name` persistido (só valida que o trim não é vazio).
- Campo fantasma `adminLimit` é **silenciosamente ignorado** pelo `validate` de planos (asserido em teste) — a decisão P0 da seção 1 continua pendente.

---

## 5. Camada de integração (Supertest + RTL/MSW)

### 5.1 API — contrato das rotas `admin/*` (supertest + Postgres do CI)

| Cenário | Resultado esperado | Prio |
|---|---|---|
| Qualquer rota `admin/*` sem `Bearer` / com token de tenant | 401/403 — `PlatformAuthGuard` a nível de classe em todos os controllers | P0 |
| `POST /admin/tenants` com slug já existente | 409 "Já existe uma organização com este slug" | P0 |
| `POST /admin/tenants` com plano inativo/inexistente | 404 "Plano nao encontrado ou inativo" | P0 |
| Fluxo tenant → admin: `POST /admin/tenants` + `POST /admin/tenants/:id/admins` | Admin criado com hash argon2id; primeiro admin marcado como primário; transação com `actorRole: 'platform_admin'` | P0 |
| CRUD de planos: `POST/PATCH /admin/plans`, `PATCH /admin/plans/:id/status` | Criação, edição e ativação/suspensão persistem; `GET /admin/plans?includeInactive=false` filtra corretamente | P1 |
| `PATCH .../admins/:userId/password` e `/status` | Reset gera novo hash; suspensão bloqueia login do admin do tenant | P1 |
| `GET /admin/billing/summary` | Contadores corretos, incluindo os ignorados (`customPlan`, `withoutPrice`, `otherCurrency`) | P2 |

### 5.2 Frontend — componentes com API mockada (RTL + MSW)

- **P0** — **Wizard:** botão "Avançar" desabilitado enquanto o passo é inválido; slug auto-gerado a partir do nome mas editável; passo 3 sobrescreve módulos ao trocar de plano; revisão exibe exatamente o draft.
- **P0** — **Wizard — falha parcial:** MSW responde 201 no tenant e 500 no admin → a UI exibe "Cliente criado, mas não foi possível provisionar o administrador." e **não** mostra modal de senha (documenta o comportamento do tenant órfão até a correção).
- **P0** — **Regressão do bug `onNotice`:** mensagens emitidas por `PlansManagement`, `PlanForm` e `BillingSummary` aparecem na tela (era descartado em silêncio antes do PR #74).
- **P1** — **PlanForm:** com `plan.id` faz PATCH, sem faz POST; limite de 200 chars na descrição; preço vazio exibe "Sob consulta".
- **P1** — **Lista de clientes:** busca em nome+slug+email (case-insensitive pt-BR); mudar filtro reseta paginação; `PAGE_SIZE=5`; MetricCards de ativos/suspensos batem com o dataset mockado.
- **P1** — **Autenticação no cliente:** reidratação da sessão via `sessionStorage` no mount; 401 em `loadTenants` → volta ao login; `signOut` limpa as duas chaves `crosshub.*`.
- **P2** — **Tenant detail:** troca de abas; modais de criar/editar admin e reset de senha abrem, validam e fecham.

### 5.3 Status da implementação (23/08/2026)

Camada de integração **implementada e verde**:

- **API (5.1):** `__tests__/integration/api/admin/contrato-admin.integration.spec.ts` — 20 cenários com supertest bootando o `AppModule` completo contra Postgres real (guard de ambiente igual ao do spec de RLS: roda no CI e localmente com `local.env` exportado; skip sem banco). Cobre: guard 401 em `admin/tenants|plans|billing`, token de tenant rejeitado nas rotas de plataforma, 409 de slug duplicado, 404 de plano inexistente/inativo, herança de módulos do plano, fluxo tenant→admin com hash argon2id + admin primário verificado no banco, 409 de e-mail duplicado, reset de senha + login real do tenant admin, suspensão bloqueando login, CRUD de planos (currency normalizada para maiúsculas, dedupe de módulos, filtro `includeInactive`), e billing summary com asserção por delta (mensal + anual/12; custom/sem preço/USD ignorados). Fixtures com prefixo `it-<run>-` e limpeza no `afterAll`.
- **Frontend (5.2):** `__tests__/component/admin/**/*.test.tsx` — 31 cenários com RTL + MSW + jsdom (Vitest em dois projetos: `admin-unit` node para `__tests__/unit/front/admin/`, `admin-component` jsdom para `__tests__/component/admin/`). Cobre todos os P0 (Continuar desabilitado por passo, slug auto-gerado e editável, colisão de slug, troca de plano sobrescrevendo módulos/add-ons, revisão exibindo o draft, **falha parcial do tenant órfão** com a mensagem exata e sem modal de senha, **regressão do onNotice** via PlansManagement/PlanForm no console), os P1 (PlanForm POST vs PATCH, limite de 200 chars, preço vazio→null e pt-BR→centavos; lista com PAGE_SIZE=5, busca case-insensitive, reset de paginação por filtro, MetricCards; reidratação de sessão, 401→login, signOut limpando as chaves) e os P2 (abas do detalhe, modais de criar/editar/reset com validação), mais o modal de senha temporária pós-criação (revelar senha).

**Contagem vs. estimativa:** a pirâmide estimava ~25 cenários; foram implementados 51 `it` blocks. A diferença tem duas origens: (a) granularidade — as linhas/bullets desta seção agrupam vários comportamentos, e cada um virou um teste separado para que uma falha aponte o comportamento exato (ex.: o bullet P0 do wizard virou 4 testes; a linha do guard virou 4); (b) **8 casos além do plano**, adicionados por serem baratos com a infraestrutura montada e vizinhos diretos dos P0:

| # | Caso extra | Arquivo | Justificativa |
|---|---|---|---|
| E1 | Login de plataforma com senha errada → 401 | `admin-contract.integration.spec.ts` | Vizinho do E2 da camada E2E; antecipa o contrato de erro do login |
| E2 | `POST /admin/tenants` sem `enabledModules` herda os módulos do plano | `admin-contract.integration.spec.ts` | Regra de negócio do `TenantsService.create` sem cobertura em nenhuma camada |
| E3 | Wizard propaga a mensagem 409 do backend ("Já existe uma organização com este slug.") | `tests/create-client-wizard.test.tsx` | Complementa o caso de falha parcial: erro na 1ª chamada, não só na 2ª |
| E4 | Modal de senha pós-criação: exibe e-mail, senha oculta por padrão, botão revelar | `tests/admin-console.test.tsx` | Risky (senha temporária efêmera, defeito P2 da seção 1) |
| E5 | Login inválido na tela exibe "E-mail ou senha inválidos." | `tests/admin-console.test.tsx` | Par do E1 no frontend |
| E6 | Tela de faturamento renderiza o resumo da API (valor formatado + ignorados) | `tests/admin-console.test.tsx` | BillingSummary não usa `onNotice`; este teste cobre sua renderização no console |
| E7 | Modal de edição de admin carrega os dados e notifica ao salvar | `tests/tenant-detail-view.test.tsx` | O bullet P2 citava "criar/editar admin"; o plano detalhava só criar/reset |
| E8 | Preço em pt-BR ("1.234,56") vira 123456 no payload do PlanForm | `tests/plan-form.test.tsx` | Liga a unidade `parsePriceInput` ao payload real enviado |

Total da pirâmide até aqui: 105 casos Vitest no admin + 64 Jest na API (44 unitários + 20 de contrato). Falta a camada E2E (seção 6).

---

## 6. Camada E2E (Playwright)

Contra API real + Postgres seedado (mesmo setup do CI). Como não há rotas, cada spec começa no login — mantenha a suíte enxuta: são as **jornadas de homologação**, não a matriz de casos.

| # | Jornada | Valida | Prio |
|---|---|---|---|
| E1 | Login → wizard completo (4 passos) → modal de senha temporária → copiar senha → cliente aparece na lista | O fluxo Core/Recent/Risky/Complex de ponta a ponta, incluindo clipboard e o slug auto-gerado | P0 |
| E2 | Login com credenciais inválidas; login válido seguido de token expirado (forjar exp curto) | Mensagens de erro; comportamento da sessão de 15 min | P0 |
| E3 | Criar plano → plano aparece como opção no passo 3 do wizard → editar preço → suspender plano → some do wizard (`includeInactive=false`) | Ciclo de vida do plano e sua propagação para o wizard | P0 |
| E4 | Detalhe do cliente: criar 2º admin → editar → resetar senha → suspender | Gestão de administradores; regra do admin primário | P1 |
| E5 | Suspender cliente na lista → status muda → reativar | Toggle de status com reload dos dados | P1 |
| E6 | Login do admin do tenant recém-criado no app dashboard com a senha temporária | Fecha o ciclo de provisionamento cross-app (o valor real do wizard) | P1 |
| E7 | Busca + filtros + paginação na lista com ≥6 clientes seedados | Filtros client-side e reset de página | P2 |
| E8 | Tela de faturamento com mix de planos (com preço, custom, sem preço) | Contadores do billing summary | P2 |

---

## 7. Homologação manual e exploratória

Complemento à automação, focado no que ela não cobre bem neste ciclo:

- **Regressão visual pós-migração (Recent):** passar pelas 7 telas (`list, create, detail, plans, create-plan, edit-plan, billing`) em light/dark e larguras estreitas — a troca de todo o CSS (incluindo o fix de `@layer base`) é a maior fonte de regressão silenciosa deste ciclo. Comparar com os screenshots de referência em `docs/admin/clientes/criar-cliente/`.
- **Acessibilidade (Conformance):** navegar o wizard e os modais só por teclado; foco visível; leitura do stepper.
- **Sessão e ambiente (Configuration-sensitive):** duas abas simultâneas (`sessionStorage` é por aba); deixar o wizard aberto >15 min e submeter; validar `NEXT_PUBLIC_API_URL` apontando para o ambiente certo em staging.
- **Tour exploratório de dados hostis:** nomes com emoji/acentos no slug, preços como "1.000.000,999", e-mails limítrofes, descrição de plano no limite de 200 chars.

---

## 8. Critérios de saída (go/no-go da homologação)

1. 100% dos casos **P0** automatizados e verdes no CI (unitário + integração + E2E E1–E3).
2. Decisão registrada para os dois defeitos P0 (campo fantasma `adminLimit` e tenant órfão): corrigido, ou aceito com workaround documentado.
3. Casos **P1** executados (automatizados ou manuais) sem falha bloqueante; falhas P2 podem virar backlog.
4. Checklist manual da seção 7 concluído em staging com paridade de configuração com produção.
5. Suítes integradas ao pipeline (`turbo test` + job E2E no GitHub Actions) para que a regressão fique protegida nos próximos deploys — este é o legado da homologação, não só o carimbo.

---

## 9. Sequência sugerida de implantação

1. **Semana 1:** extração das funções puras para `apps/admin/lib/` + setup Vitest/RTL/MSW + camada unitária P0 (frontend e backend) + supertest nos contratos P0.
2. **Semana 2:** integração frontend P0/P1 (wizard, onNotice, PlanForm) + setup Playwright + E1–E3.
3. **Semana 3:** E4–E6, casos P1 restantes, checklist manual em staging, relatório de homologação e decisão go/no-go.

---

*Referências: `docs/admin/*.md` (PRDs de clientes, planos, faturamento e menu) · `docs/design-system/plano-refatoracao.md` · Bach, J. — RCRCRC Regression Testing Heuristic (Satisfice Inc.).*
