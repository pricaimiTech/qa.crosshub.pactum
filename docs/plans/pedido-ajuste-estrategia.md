# Pedido de ajuste — Estratégia de Testes do Dashboard

> **Atendido em 31/08/2026.** A estratégia passou a publicar
> `.doc/dashboard/estrategia-testes-dashboard.json` com todos os campos pedidos, e
> `scripts/build-case-map.mjs` já consome esse arquivo. Documento mantido como histórico
> do contrato acordado entre a estratégia e a automação — se as tabelas mudarem de formato,
> é aqui que está escrito o que o mapa espera.

Documento de solicitação para quem mantém `.doc/dashboard/estrategia-testes-dashboard.html`.

**Objetivo:** fechar a lacuna entre os casos de API da estratégia e a automação. Hoje o projeto
tem os 137 services gerados de `openapi.json`, mas só **26 dos 150 casos** de API conseguem ser
ligados automaticamente ao endpoint que testam — os outros 124 não citam a rota de forma
processável. Com os ajustes abaixo, `npm run generate:map` fecha os 150 e o esqueleto de cada
`-F.test.ts` sai com o service certo já importado.

---

## 1. Formato pedido para as tabelas "Casos de API"

Substituir as colunas atuais por:

| ID | Cenário | Rota | Token | Status | Pré-condição | Asserção | Doc | Prio |
|---|---|---|---|---|---|---|---|---|

As colunas **Cenário**, **Pré-condição**, **Doc** e **Prio** continuam exatamente como estão.
As três novas — **Rota**, **Token**, **Status** — são o que falta, e **Asserção** é a
"Resultado esperado" atual, com uma regra a mais (item 1.4).

### 1.1 `Rota` — obrigatória

Método e caminho **literais do `openapi.json`**, path params entre chaves:

```
POST /dashboard/appointments/{id}/reschedule
```

O que quebra o casamento automático hoje:

| Escrito hoje | Problema | Escrever assim |
|---|---|---|
| `PUT .../professionals/:id/availability` | `...` elide o prefixo; `:id` não é a notação do contrato | `PUT /dashboard/appointments/professionals/{id}/availability` |
| `GET .../availability` | ambíguo — casa com 3 rotas diferentes | `GET /dashboard/appointments/availability` |
| *(nada — só texto em prosa)* | 124 casos estão assim | a rota, sempre |

Quando o caso toca **mais de uma rota**, listar todas na coluna, uma por linha,
separando o arranjo da ação — ver item 1.5.

### 1.2 `Token` — obrigatória

Qual das três audiências de JWT o caso usa. Valores exatamente como no contrato:

- `tenantAuth` — admin do tenant (`POST /auth/platform/tenant/login`)
- `endUserAuth` — cliente final (`POST /auth/platform/public/login`)
- `platformAuth` — super admin (`POST /auth/platform/login`)
- `—` quando a rota é aberta (`/health`, `/public/tenants/{slug}`)

**Por que importa:** vários casos da estratégia se distinguem *só* pela audiência.
`API-AG-19` (prazo de 24 h vale para o cliente) e `API-AG-20` (não vale para o admin)
chamam rotas diferentes com tokens diferentes, mas hoje a linha diz apenas "cliente" e
"admin" em prosa. É a diferença entre dois logins distintos no `before` do teste.

### 1.3 `Status` — obrigatória

O status HTTP esperado: `200`, `201`, `400`, `409`, `404`. Vira o `paramsDefault.statusCode`
do service sem nenhuma inferência.

Quando o caso cobre mais de um status (bordas), listar na ordem das asserções:
`API-AG-19` → `400` (23 h 59 min) e `200` (24 h 01 min).

### 1.4 `Asserção` — o que já existe, com uma regra

Manter o texto atual, mas **sempre incluir o valor literal** que prova o caso:
mensagem de erro entre aspas, nome do campo, ou o valor esperado.

Bons exemplos, que já estão assim e praticamente geram o teste sozinhos:

- `API-AG-07` — `"Para realizar outro agendamento neste dia, entre em contato com a administração."`
- `API-AG-16` — `409 "Horário indisponível."`
- `API-AG-17` — `remainingCapacity: 0`

Casos que precisam do ajuste:

- `API-AG-06` — *"400 em cada variação, com o campo inválido identificado"* → **qual** campo,
  e qual mensagem, para cada uma das quatro variações (duração 0, intervalo −1, capacidade 0, fim < início).
- `API-AG-23` — *"400. Os cinco estados finais não voltam"* → a mensagem de erro da transição inválida.
- `API-AG-29` — *"Conflito; a alternativa oferecida é inativar"* → o status (`409`?) e o texto da alternativa.

### 1.5 Casos multi-rota — separar arranjo de ação

`API-AG-31` (crédito de pacote) hoje é uma linha só, mas atravessa quatro chamadas:
venda de pacote → agendamento → cancelamento → restauração excepcional, conferindo o
`ledger` entre cada etapa. Vira um teste grande e difícil de diagnosticar quando falha.

Pedido: quando o caso tiver mais de uma ação sob teste, quebrar em casos numerados
(`API-AG-31a`, `-31b`, …) ou marcar na coluna **Rota** qual é arranjo e qual é a ação:

```
arranjo: POST /dashboard/appointments/people/{personId}/packages
arranjo: POST /dashboard/appointments
ação:    POST /dashboard/appointments/{id}/package-credit/exceptional-restore
verifica: GET /dashboard/appointments/package-contracts/{id}/ledger
```

---

## 2. Formato de saída — o pedido que vale mais que todos os outros

Se for possível, publicar junto do HTML um **`estrategia-testes-dashboard.json`** com os
mesmos casos em forma de dados:

```json
{
  "id": "API-AG-16",
  "modulo": "AG",
  "camada": "API",
  "prioridade": "P0",
  "cenario": "Concorrência na última vaga",
  "rotas": [
    { "papel": "acao", "metodo": "POST", "caminho": "/dashboard/appointments" }
  ],
  "token": "endUserAuth",
  "status": [201, 409],
  "precondicao": "Janela com remainingCapacity: 1; duas requisições simultâneas de clientes distintos",
  "assercao": "Uma 201, outra 409 \"Horário indisponível.\" Nunca duas confirmadas. Repetir 20 vezes.",
  "doc": "AG-15"
}
```

Com isso, `scripts/build-case-map.mjs` deixa de raspar HTML — some toda a heurística de
casamento por sufixo, que é justamente onde os 124 casos se perdem.

---

## 3. Correções pontuais no conteúdo — **os três atendidos**

1. ~~**Contagem divergente.**~~ Resolvida. O painel e as tabelas somam o mesmo, e o build
   emite o total a partir das tabelas em vez de repetir um número escrito à mão. Hoje são
   **167 casos**.

2. ~~**Módulo sem endpoint.**~~ Confirmado: o contrato não expõe nenhuma rota de auditoria, e
   os quatro casos que dependem dela (`F-21`, `LGPD-13`, `C-15`, `AN-04`) estão marcados como
   **não verificáveis** na estratégia, ligados às issues #96 e #98. A pasta `audit/` do projeto
   de automação está vazia — ver a pendência abaixo.

3. ~~**Divergência em `API-AG-22`.**~~ O caso continua documentando que
   `POST /public/me/appointments/{id}/reschedule` existe na especificação e não no contrato, e a
   asserção diz isso com todas as letras: *"Divergência entre especificação e código"*. Está na
   issue **#86**, junto com as outras divergências de contrato. O teste asserta o comportamento
   atual **de propósito** e com a divergência registrada — é diferente de congelá-la em silêncio.

---

## 5. O que a triagem de 01/09/2026 encontrou

O mapa afirmava **166 de 166 casos com teste** enquanto havia 156 arquivos: a coluna era
derivada do ID do caso, não conferida contra o disco. Três dos casos sem teste eram P0.

O que mudou de contrato entre a estratégia e a automação:

- A estratégia passa a marcar caso **não verificável** com
  `<span class="nao-verificavel" data-issue="N">motivo</span>` dentro da célula de cenário, e o
  build emite `naoVerificavel: { motivo, issue }`. O motivo mora aqui, não no gerador do mapa:
  quem escreve o caso é quem sabe por que ele não é escrevível.
- `npm run generate:map` **reprova** quando um caso P0 fica sem teste, e confere nos dois
  sentidos — inclusive arquivo no disco sem caso na estratégia, que foi como o `G-08b` apareceu.

### Pendência aberta deste lado

A pasta `audit/` do projeto de automação está **vazia** e tem três scripts npm
(`all-audit`, `e2e-audit`, `functional-audit`) que não executam nada. Ou o módulo volta quando a
issue #98 for resolvida, ou a pasta e os scripts saem. Não decidi por conta própria porque
apagar a pasta é sinalizar que auditoria saiu do escopo, e ela não saiu — está bloqueada.

---

## 4. O que já está pronto do lado da automação

Para contexto de quem for atender este pedido:

- `openapi.json` na raiz é a fonte de verdade das rotas — 137 operações, 173 schemas.
- `core/src/services/<dominio>/` tem **um service por operação**, com o nome derivado do
  `operationId` (ex.: `postCreateAppointment`, `getPublicMyAppointments`, `patchSensitiveDataAccess`).
- `docs/plans/mapa-casos-api.md` é regerado por `npm run generate:map` e mostra, hoje, quais
  casos já casam com um service e quais estão como `— a definir`.
