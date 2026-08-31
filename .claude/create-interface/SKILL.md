---
name: create-interface
description: Cria arquivos TypeScript `I[Nome].interface.ts` em core/src/interface, com prefixo I e arrays como Array<T>. Use ao modelar request/response ou DTO da API do CrossHub, ou quando o usuário pedir "interface", "tipar payload", "IParams".
---

# create-interface — Interfaces (`*.interface.ts`)

## Antes de criar

- [ ] Já existe `IAlgo` no mesmo domínio em `core/src/interface/`?
- [ ] Os DTOs reais estão em `apps/api/src/[dominio]/*.openapi.ts` do CrossHub — conferir antes de modelar.
- [ ] Caminho: `core/src/interface/[dominio]/[contexto]/I[Nome].interface.ts`.

## Regras

- Nome do arquivo: **`I[Nome].interface.ts`**.
- Toda interface pública exportada com prefixo **`I`**.
- **Arrays**: `Array<string>`, `Array<IModelo>` — **não** usar `string[]` ou `IModelo[]`.
- **Sem `any`** — usar tipos explícitos, uniões, ou `unknown` com narrowing se indispensável.
- Tipos compartilhados pequenos (range, sub-objeto) podem ficar **no mesmo arquivo**.
- Erros da API seguem o padrão Nest — reutilizar `IApiError` de `core/src/interface/global.interface.ts` em vez de recriar.

## Template

```typescript
export interface IPersonContact {
  email: string
  phone: string | null
}

export interface IPerson {
  id: string
  name: string
  status: "active" | "inactive"
  contact: IPersonContact
  groupIds: Array<string>
}

export interface ICreatePerson {
  name: string
  email: string
  groupIds: Array<string>
}
```

## Referência viva no repositório

- `core/src/interface/global.interface.ts` (`IParamsDefault`, `IRetry`, `IApiError`)
- `core/src/interface/auth/IAuth.interface.ts`
