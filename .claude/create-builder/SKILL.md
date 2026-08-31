---
name: create-builder
description: Cria classe DataBuilder com with*(), build() e JSDoc em core/src/dataBuilder. Use ao montar payload fluente para POST/PUT/PATCH da API do CrossHub, ou quando o usuário pedir "DataBuilder", "builder", "massa com faker para criar recurso".
---

# create-builder — DataBuilder (`*.dataBuilder.ts`)

## Antes de criar

- [ ] Buscar em `core/src/dataBuilder/` pelo contexto — **não duplicar** builder existente.
- [ ] Para **POST, PUT ou PATCH**: é **obrigatório** existir DataBuilder correspondente, **registrado** em `core/src/constants.ts` (export instanciado) e consumido no teste via essa constante — **nunca** `new MeuBuilder()` no `.test.ts`.
- [ ] A interface de entrada/saída já existe em `core/src/interface/...`? Criar antes se necessário (skill `create-interface`).

## Localização

`core/src/dataBuilder/[dominio]/[contexto]/[nome].dataBuilder.ts`

## Regras

- Classe `export default class ...DataBuilder`.
- Estado privado tipado (ex.: `ICreatePerson`).
- `constructor()` inicializa com `@faker-js/faker`.
- Métodos `with*(...): this` com **JSDoc** em cada um.
- `build(): IContrato` retorna o objeto final.
- Arrays: `Array<string>`, não `string[]`.
- O payload é o **body REST direto** — sem envelope `{ args, name, version }`.

## Após criar a classe

1. Exportar instância em `core/src/constants.ts`: `export const personBuilder = new PersonDataBuilder()`.
2. No teste: importar de `@core/constants` e encadear `.with...().build()`.

## Template

```typescript
import { faker } from "@faker-js/faker"
import type { ICreatePerson } from "../../../interface/people/IPerson.interface"

export default class PersonDataBuilder {
  private personData: ICreatePerson

  constructor() {
    this.personData = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      groupIds: [] as Array<string>
    }
  }

  /**
   * Define o nome da pessoa, sufixado para evitar colisão entre execuções
   */
  withName(name: string): PersonDataBuilder {
    this.personData.name = `${name} - ${faker.person.lastName()}`
    return this
  }

  /**
   * Vincula a pessoa a um ou mais grupos
   */
  withGroupIds(groupIds: Array<string>): PersonDataBuilder {
    this.personData.groupIds = groupIds
    return this
  }

  /**
   * Constrói o payload final
   */
  build(): ICreatePerson {
    return this.personData
  }
}
```
