---
name: create-test-functional
description: Cria arquivo de teste funcional `[CODIGO]-F.test.ts` para regras de negócio e respostas 4xx da API do CrossHub. Use ao validar erro de API, mensagem de validação, ou quando o usuário pedir "teste funcional", "teste F", "-F.test.ts".
---

# create-test-functional — Testes funcionais (`-F.test.ts`)

## Antes de criar

- [ ] Pasta `[dominio]/tests/functional/[contexto]/`.
- [ ] Nome: `[CÓDIGO]-F.test.ts` (ex.: `CH-1234-F.test.ts`) — **um `it` por arquivo**.
- [ ] No `.data.ts` do cenário: `paramsDefault400` (ou 401/403/404/409) para o status esperado.

## Regras

Mesmas do E2E (`create-test-e2e`), com ênfase em:

- Esperar **status 4xx** via `preSetup.preSetupParamsDefault(400, 5, 500, token)`.
- Validar o **corpo de erro padrão do Nest**: `json.message` e `json.statusCode`
  (`IApiError` em `core/src/interface/global.interface.ts`). A mensagem esperada vem do
  `.data.ts` e deve bater com a lançada no controller da API.
- **Sem `for` / `if` em todo o arquivo** (hooks e funções inclusive); condicionais no core.
- **Triple-A**; **cleanup no `before`**; **sem asserts em `before`/`beforeEach`**.
- **Sem `any`**; `Array<string>` em vez de `string[]`.

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

  before("Pré-condições", async () => {
    // Arrange apenas — sem asserts aqui
    authParams = await authBusiness.loginAsTenantAdmin(
      `${process.env.TENANT_SLUG}`,
      `${process.env.ADMIN_EMAIL}`,
      `${process.env.ADMIN_PASSWORD}`,
      peopleXXXX.paramsDefault
    )
  })

  it("[CH-XXXX-F] - Não cria pessoa com nome em branco", async () => {
    const { json } = await postCreatePerson(
      peopleXXXX.invalidValue,
      peopleXXXX.email,
      peopleXXXX.paramsDefault400(authParams.token)
    )

    assertTs.equal(json.message, peopleXXXX.errorMessage, "Mensagem de erro diferente da esperada.")
    assertTs.equal(json.statusCode, 400, "Status code do corpo de erro divergente.")
  })
})
```

## Execução

```bash
npm run functional-[dominio]     # ex.: npm run functional-people
```
