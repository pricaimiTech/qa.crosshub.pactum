---
name: create-utils
description: Cria funções utilitárias puras em `[nome].utils.ts` dentro de core/src/utils, sem classe. Use para UUID, datas, helpers compartilhados, ou quando o usuário pedir "utils", "helper", "função em utils".
---

# create-utils — Utilitários (`*.utils.ts`)

## Antes de criar

- [ ] Já existe função equivalente em `core/src/utils/` ou subpasta de domínio?
- [ ] Nome do arquivo: `[nome].utils.ts`.

## Localização

- Raiz: `core/src/utils/[nome].utils.ts`
- Por domínio: `core/src/utils/[dominio]/[nome].utils.ts`

## Regras

- **Funções exportadas** (named ou `default` conforme o padrão do arquivo) — **sem** classe wrapper.
- **UUID**: usar `faker.string.uuid()` — não adicionar a dependência `uuid`.
- Funções **puras** quando possível; sem efeitos colaterais ocultos.
- **Sem `any`**; arrays como `Array<T>`.

## Exemplo

```typescript
import { faker } from "@faker-js/faker"

/**
 * Gera um UUID v4 para uso em massa de teste
 */
export default function generateUuidV4() {
  return faker.string.uuid()
}
```

## Anti-padrões

- Colocar chamadas HTTP em `utils` (isso é **service**).
- Extrair token de resposta em `utils` quando o lugar certo é `business/`.
