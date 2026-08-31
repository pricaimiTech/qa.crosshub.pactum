---
name: create-business
description: Cria classe business em core/src/business com métodos async que orquestram services e assertTs para validações reutilizáveis entre testes. Use ao extrair fluxo repetido de API e asserts, ou quando o usuário pedir "business", "regra reutilizável", "login business".
---

# create-business — Business (`*.business.ts`)

## Antes de criar

- [ ] O fluxo já aparece duplicado em vários testes? Business é para **reuso**, não para um único teste.
- [ ] Caminho: `core/src/business/[dominio]/[contexto]/[nome].business.ts`.

## Regras

- `export default class NomeBusiness`.
- Métodos **`public async`**; parâmetros tipados; argumento final típico: `paramsDefault: IParamsDefault`.
- **JSDoc** em cada método público (`@param`, descrição do comportamento).
- Dentro do método: chamar **services** existentes; usar **`assertTs`** para invariantes de negócio.
- É o lugar certo para **condicionais** (`if`/`for`) que os arquivos de teste proíbem — ex.: "se não existir, criar".
- **Não** colocar lógica Mocha (`it`, `describe`) aqui.

## Uso típico no CrossHub

Login e propagação de token: o business autentica, extrai o `accessToken` e devolve
um `IParamsDefault` já com `token` preenchido para os demais services.

## Template

```typescript
import { assertTs, preSetup } from "../../constants"
import type { IParamsDefault } from "../../interface/global.interface"
import postTenantLogin from "../../services/auth/postTenantLogin.service"

export default class AuthBusiness {
  /**
   * Autentica o admin do tenant e devolve os params já com o Bearer token
   * @param slug - Slug do tenant
   * @param email - E-mail do administrador
   * @param password - Senha do administrador
   * @param paramsDefault - Parâmetros padrão da requisição de login
   * @returns Novos params contendo o accessToken obtido
   */
  public async loginAsTenantAdmin(
    slug: string,
    email: string,
    password: string,
    paramsDefault: IParamsDefault
  ): Promise<IParamsDefault> {
    const response = await postTenantLogin(slug, email, password, paramsDefault)

    assertTs.isNotNull(response.json.accessToken, "Login do tenant não retornou accessToken.")

    return preSetup.preSetupParamsDefault200(
      paramsDefault.retry.count,
      paramsDefault.retry.delay,
      response.json.accessToken
    )
  }
}
```

## Após criar

Exportar a instância em `core/src/constants.ts` quando o business for usado em vários
testes: `export const authBusiness = new AuthBusiness()`.
