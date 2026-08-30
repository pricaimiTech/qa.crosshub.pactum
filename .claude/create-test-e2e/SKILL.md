---
name: create-test-e2e
description: Cria arquivo de teste E2E `[CODIGO]-E.test.ts` com um único `it`, Mocha, Pactum e assertTs. Use ao criar teste end-to-end, fluxo completo da API do CrossHub, ou quando o usuário pedir "teste E2E", "arquivo -E.test.ts".
---

# create-test-e2e — Testes E2E (`-E.test.ts`)

## Antes de criar

- [ ] Pasta `[dominio]/tests/e2e/` existe? Criar só as subpastas de contexto que faltarem.
- [ ] Nome: `[CÓDIGO]-E.test.ts` (ex.: `CH-1234-E.test.ts`) — **um teste por arquivo**.
- [ ] Massa do cenário já existe em `[dominio]/data/[funcionalidade].data.ts`? (skill `create-data`)

## Regras críticas

1. **Um único `it` por arquivo.**
2. **Proibido** `for` e **proibido** `if` em **todo** o arquivo `*-E.test.ts` — inclui `before`, `beforeEach`, `it`, `after` e **qualquer** função declarada no mesmo arquivo. Fluxos condicionais ("se não existir, criar") vão para `core/src/business/` ou `core/src/utils/`; no teste, apenas `await` em sequência, asserts diretos, `deepEqual` e índices fixos.
3. **Triple-A**: todas as chamadas de API necessárias **antes** dos asserts; **nenhuma** chamada após o primeiro bloco de asserts; **asserts somente nas linhas finais do `it`**.
4. **`before` / `beforeEach`**: apenas **Arrange** (login, obtenção de ids, cleanup, pré-condições). **Proibido** `assertTs`, `expect` ou qualquer asserção — asserções **somente** no **`it`**.
5. **Cleanup / exclusão de dados**: no `before`, **nunca** no `after`.
6. **Sem `any`** — tipar pelo response (`Awaited<ReturnType<typeof service>>`) ou por interface do core.
7. **`Array<string>`** em tipos, não `string[]`.
8. Credenciais e strings vêm do `.data.ts` e de `process.env`, nunca literais soltos no `it`.

## Autenticação

A API do CrossHub é REST com Bearer token. O `before` faz o login via business e guarda
o `IParamsDefault` já com token; os services do `it` recebem esse objeto.

## Template

```typescript
import { assertTs, describeName } from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import AuthBusiness from "@core/business/auth/auth.business"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import { peopleXXXX } from "@people-data/people.data"

describe(describeName.dashboard, () => {
  const authBusiness = new AuthBusiness()
  let authParams: IParamsDefault
  let personResponse: Awaited<ReturnType<typeof postCreatePerson>>

  before("Pré-condições e cleanup", async () => {
    // Arrange apenas — sem asserts aqui
    authParams = await authBusiness.loginAsTenantAdmin(
      `${process.env.TENANT_SLUG}`,
      `${process.env.ADMIN_EMAIL}`,
      `${process.env.ADMIN_PASSWORD}`,
      peopleXXXX.paramsDefault
    )
  })

  it("[CH-XXXX-E] - Cria uma pessoa no dashboard do tenant", async () => {
    personResponse = await postCreatePerson(
      peopleXXXX.name,
      peopleXXXX.email,
      authParams
    )

    assertTs.equal(personResponse.json.name, peopleXXXX.name, "Nome divergente do esperado.")
    assertTs.isNotNull(personResponse.json.id, "A pessoa criada deveria ter id.")
  })
})
```

Ajuste imports de services e data ao domínio do teste.

## assertTs

`assertTs.equal`, `assertTs.isTrue`, `assertTs.isFalse`, `assertTs.isNotNull`,
`assertTs.deepEqual` — sempre com mensagem descritiva em português.

## Execução

```bash
npm run e2e-[dominio]     # ex.: npm run e2e-people
```
