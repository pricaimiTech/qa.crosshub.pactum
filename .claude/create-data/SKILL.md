---
name: create-data
description: Cria ou estende arquivos `[funcionalidade].data.ts` com `paramsDefault` embutido, `faker` e `preSetup`. Use ao adicionar dados de teste, criar objeto de cenário (peopleXXXX), ou quando o usuário pedir "criar data file", "dados de teste", "massa no .data.ts".
---

# create-data — Arquivos `.data.ts`

## Antes de criar

- [ ] Existe a pasta `[dominio]/data/`? Domínios: `addons`, `analytics`, `appointments`, `audit`, `auth`, `banners`, `billing`, `branding`, `catalog`, `dashboard`, `forms`, `groups`, `people`, `plans`, `privacy`, `tenants`.
- [ ] Já existe DataBuilder para o mesmo domínio? Se sim, usar no teste e evitar duplicar massa estática.
- [ ] Nome do arquivo: `[funcionalidade].data.ts` (ex.: `people.data.ts`).

## Localização

- Do domínio: `[dominio]/data/[funcionalidade].data.ts` (alias `@[dominio]-data/...`)
- Compartilhada entre domínios: `data/[funcionalidade].data.ts` (alias `@shared-data/...`)

## Regras obrigatórias

- **`paramsDefault` dentro de cada objeto exportado** — não separar em constante solta.
- Cenário 200: `preSetup.preSetupParamsDefault200(5, 500)` de `@core/constants`.
  O token só existe depois do login, então cenários autenticados recebem o token via
  business no `before` (ver `create-business`).
- Cenário 4xx: `preSetup.preSetupParamsDefault(400, 5, 500, token)`.
- **Sem desestruturação** nos testes que consomem estes dados — passar propriedades do objeto exportado.
- Valores usados nos testes vêm do `.data.ts`, não hardcoded no `.test.ts`.
- Payloads grandes de POST/PUT/PATCH: usar DataBuilder (skill `create-builder`).

## Template

```typescript
import { faker } from "@faker-js/faker"
import { preSetup } from "@core/constants"

export const peopleXXXX = {
  name: `[PEOPLE-XXXX] ${faker.person.firstName()}`,
  email: faker.internet.email().toLowerCase(),
  paramsDefault: preSetup.preSetupParamsDefault200(5, 500)
}
```

### Cenário de erro (4xx)

```typescript
export const peopleXXXX = {
  invalidValue: " ",
  errorMessage: "E-mail e senha são obrigatórios.",
  paramsDefault: preSetup.preSetupParamsDefault200(5, 500),
  paramsDefault400: (token?: string) =>
    preSetup.preSetupParamsDefault(400, 5, 500, token)
}
```

## Anti-padrões

- Objetos de teste sem `paramsDefault`.
- Credenciais literais no `.data.ts` — usar `process.env` (ver `.env.example`).
