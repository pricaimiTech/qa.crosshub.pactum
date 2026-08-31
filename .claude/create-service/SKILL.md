---
name: create-service
description: Cria serviço HTTP Pactum `[verbo][Endpoint].service.ts` REST em core/src/services com bearer token, retry e expectStatus. Use ao implementar chamada da API do CrossHub a partir de curl/Swagger, ou quando o usuário pedir "criar service", "postTenantLogin", "endpoint dashboard".
---

# create-service — Serviços (`*.service.ts`)

## Antes de criar

- [ ] **Curl, Swagger ou o `*.controller.ts` da API** foi consultado? **Não inventar** rota, verbo, nem formato do body.
- [ ] Se o método for **POST, PUT ou PATCH**: garantir que exista **DataBuilder** para o payload (ver skill `create-builder`).
- [ ] Caminho: `core/src/services/[dominio]/[contexto]/`.
- [ ] Nome: `[verboHTTP][NomeEndpoint].service.ts` (ex.: `postTenantLogin.service.ts`).

## API do CrossHub — o que muda em relação a outros projetos

É uma API **REST (NestJS)**, sem envelope sdkgen. Não existe `{ args, name, version }`:
o payload vai direto em `.withJson({...})` e a resposta é lida em `response.json`.

Não há prefixo global. Os prefixos reais vivem em `core/src/data/api.data.ts`:

| Área | Chaves de `apiName` |
|---|---|
| Auth | `authPlatform` (`/auth/platform`) |
| Super admin | `adminTenants`, `adminPlans`, `adminBilling`, `adminAddOns` |
| Tenant logado | `dashboard`, `dashboardPeople`, `dashboardGroups`, `dashboardForms`, `dashboardAppointments`, `dashboardBanners`, `dashboardBranding`, `dashboardPrivacy` |
| Público | `public`, `publicTenants` |
| Infra | `assets`, `health` |

## Regras

- **JSDoc obrigatório**: descrição, `@param` por argumento, `@returns`.
- `specPactumJs()` + método HTTP + `${process.env.BASE_URL}${apiName.[chave]}/...`.
- Rotas autenticadas: `.withBearerToken(\`${paramsDefault.token}\`)`.
- Body em `.withJson({...})`; query em `.withQueryParams(...)`; path param interpolado na URL.
- `.expectStatus(paramsDefault.statusCode, "mensagem clara se falhar")`.
- `.retry({ count: paramsDefault.retry.count, delay: paramsDefault.retry.delay, strategy })`.
- Imports relativos dentro de `core/src` (ajustar `../` conforme a profundidade da pasta).

## Template

```typescript
import { specPactumJs } from "../../constants"
import { apiName } from "../../data/api.data"
import type { IParamsDefault } from "../../interface/global.interface"

/**
 * Cria uma pessoa no dashboard do tenant
 * @param name - Nome da pessoa
 * @param email - E-mail da pessoa
 * @param paramsDefault - Parâmetros padrão da requisição
 * @returns Resposta da criação da pessoa
 */
export default async function postCreatePerson(
  name: string,
  email: string,
  paramsDefault: IParamsDefault
) {
  return await specPactumJs()
    .post(`${process.env.BASE_URL}${apiName.dashboardPeople}`)
    .withBearerToken(`${paramsDefault.token}`)
    .withJson({ name, email })
    .expectStatus(
      paramsDefault.statusCode,
      `O status code da requisição ${apiName.dashboardPeople} não é o esperado.`
    )
    .retry({
      count: paramsDefault.retry.count,
      delay: paramsDefault.retry.delay,
      strategy: ({ res }) => res.statusCode === paramsDefault.statusCode
    })
}
```

## Referência viva no repositório

- `core/src/services/auth/postPlatformLogin.service.ts`
- `core/src/services/auth/postTenantLogin.service.ts`
