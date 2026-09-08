# Mapa dos casos de API — Estratégia do Dashboard

Rastreabilidade entre os **175 casos de API** de `.doc/dashboard/estrategia-testes-dashboard.json` (101 deles P0), os endpoints de `openapi.json` e os services em `core/src/services/`.

Estratégia gerada em 2026-09-08 · mapa gerado por `npm run generate:map` — não editar à mão.

| Convenção | Valor |
|---|---|
| Arquivo de teste | `<dominio>/tests/functional/<ID sem o prefixo API->-F.test.ts` |
| Jornadas E2E | `<dominio>/tests/e2e/`, com os IDs `E2E-*` da estratégia |
| Service | `core/src/services/<dominio>/<nome>.service.ts` |
| Login no `before` | conforme a coluna Token: `tenantAuth` → `loginAsTenantAdmin()` · `platformAuth` → `loginAsPlatformAdmin()` · `endUserAuth` → `loginAsEndUser()` |

## Agendamentos (`AG`)

Domínio: `appointments/` · casos: 36 (P0: 20)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-AG-01` | P0 | Geração de janelas sem intervalo | `tenantAuth` | 200 | `getAvailability` | `postCreateService`<br>`putSetProfessionals`<br>`putSaveProfessionalAvailability` | — | `AG-01-F.test.ts` | — |
| `API-AG-02` | P0 | Geração de janelas com intervalo | `tenantAuth` | 200 | `getAvailability` | `putSetProfessionals`<br>`putSaveProfessionalAvailability` | — | `AG-02-F.test.ts` | — |
| `API-AG-03` | P0 | Janela que não cabe no turno | `tenantAuth` | 200 | `getAvailability` | `putSetProfessionals`<br>`putSaveProfessionalAvailability` | — | `AG-03-F.test.ts` | — |
| `API-AG-04` | P1 | Janelas já passadas são omitidas | `tenantAuth` | 200 | `getAvailability` | — | — | `AG-04-F.test.ts` | — |
| `API-AG-05` | P0 | Disponibilidade sobreposta é rejeitada | `tenantAuth` | 400 | `putSaveProfessionalAvailability` | — | — | `AG-05-F.test.ts` | — |
| `API-AG-06` | P1 | Validação de parâmetros do vínculo serviço–profissional | `tenantAuth` | 400 | `putSetProfessionals` | — | `Configuração de profissional inválida.` | `AG-06-F.test.ts` | — |
| `API-AG-07` | P0 | Limite de um agendamento por dia — cliente | `endUserAuth` | 409 | `postPublicCreateAppointmentRace` | `postPublicCreateAppointmentRace` | `Para realizar outro agendamento neste dia, entre em contato com a administração.` | `AG-07-F.test.ts` | — |
| `API-AG-08` | P0 | Cancelado não bloqueia novo agendamento | `endUserAuth` | 201 | `postPublicCreateAppointmentRace` | `postPublicCreateAppointmentRace`<br>`postPublicCancelAppointment` | — | `AG-08-F.test.ts` | — |
| `API-AG-09` | P0 | Admin não tem limite diário | `tenantAuth` | 201 | `postCreateAppointment` | `postCreateAppointment` | — | `AG-09-F.test.ts` | — |
| `API-AG-10` | P0 | approvalMode: manual | `endUserAuth` | 201 | `postPublicCreateAppointmentRace` | `postCreateService`<br>`getPublicAvailability` | `pending` | `AG-10-F.test.ts` | — |
| `API-AG-11` | P0 | approvalMode: automatic | `endUserAuth` | 201 | `postPublicCreateAppointmentRace` | `postCreateService` | `approved` | `AG-11-F.test.ts` | — |
| `API-AG-12` | P1 | Seleção de profissional automatic | `endUserAuth` | 400 | `postPublicCreateAppointmentRace` | — | — | `AG-12-F.test.ts` | — |
| `API-AG-13` | P1 | Seleção de profissional required | `endUserAuth` | 400 | `postPublicCreateAppointmentRace` | `getPublicAvailability` | — | `AG-13-F.test.ts` | — |
| `API-AG-14` | P1 | Desempate da distribuição automática | `endUserAuth` | 201 | `postPublicCreateAppointmentRace` | `putSetProfessionals` | — | `AG-14-F.test.ts` | — |
| `API-AG-15` | P0 | Distribuição respeita elegibilidade | `endUserAuth` | 201 | `postPublicCreateAppointmentRace` | `putSetProfessionals`<br>`putSaveProfessionalAvailability` | `gera aquela janela`<br>`está vinculado` | `AG-15-F.test.ts` | — |
| `API-AG-16` | P0 | Concorrência na última vaga | `endUserAuth` | 201, 409 | `postPublicCreateAppointmentRace` | `getPublicAvailability` | `Horário indisponível.` | `AG-16-F.test.ts` | — |
| `API-AG-17` | P0 | Capacidade esgotada | `endUserAuth` | 409 | `postPublicCreateAppointmentRace` | `postPublicCreateAppointmentRace`<br>`getPublicAvailability` | — | `AG-17-F.test.ts` | — |
| `API-AG-18` | P1 | Cancelamento libera vaga | `endUserAuth` | 201 | `postPublicCreateAppointmentRace` | `postPublicCancelAppointment` | — | `AG-18-F.test.ts` | — |
| `API-AG-19` | P0 | Prazo de cancelamento — cliente | `endUserAuth` | 409, 200 | `postPublicCancelAppointment` | `putSaveSettings`<br>`postPublicCreateAppointmentRace` | `Para cancelar com menos de 24 horas de antecedência, entre em contato com a administração.` | `AG-19-F.test.ts` | — |
| `API-AG-20` | P1 | Prazo de cancelamento não vale para o admin | `tenantAuth` | 200 | `patchUpdateAppointmentStatus` | `postPublicCreateAppointmentRace` | — | `AG-20-F.test.ts` | — |
| `API-AG-21` | P1 | Reagendamento encadeia os registros | `tenantAuth` | 200 | `postRescheduleAppointment` | `postCreateAppointment`<br>`getAvailability` | — | `AG-21-F.test.ts` | — |
| `API-AG-21b` | P1 | Reagendamento exige horário e motivo | `tenantAuth` | 400 | `postRescheduleAppointment` | — | `Informe novo horário e motivo da remarcação.` | `AG-21b-F.test.ts` | — |
| `API-AG-22` | P0 | Reagendamento pelo cliente não existe na API | `endUserAuth` | 200 | `getPublicMyAppointments` | — | — | `AG-22-F.test.ts` | — |
| `API-AG-23` | P0 | Transições de estado inválidas | `tenantAuth` | 409 | `patchUpdateAppointmentStatus` | `patchUpdateAppointmentStatus` | `Essa alteração de status não é permitida.` | `AG-23-F.test.ts` | — |
| `API-AG-23b` | P1 | Status fora do enum e motivo obrigatório | `tenantAuth` | 400 | `patchUpdateAppointmentStatus` | — | `Status inválido.`<br>`Informe o motivo para registrar este status.` | `AG-23b-F.test.ts` | — |
| `API-AG-24` | P0 | Bloqueio impede criação mas preserva o passado | `tenantAuth` | 201 | `postCreateBlock` | `postCreateAppointment`<br>`postPublicCreateAppointmentRace` | — | `AG-24-F.test.ts` | — |
| `API-AG-25` | P1 | Bloqueio parcial não fecha a janela | `endUserAuth` | 200 | `getPublicAvailability` | `postCreateBlock` | — | `AG-25-F.test.ts` | — |
| `API-AG-26` | P1 | Bloqueio sem alvo | `tenantAuth` | 400 | `postCreateBlock` | — | `Selecione um profissional ou serviço para bloquear.` | `AG-26-F.test.ts` | — |
| `API-AG-27` | P1 | Feriado é visual, não bloqueia | `tenantAuth` | 200 | `getCalendar` | `getAvailability` | — | `AG-27-F.test.ts` | — |
| `API-AG-28` | P2 | Feriado móvel | `tenantAuth` | 200 | `getCalendar` | — | — | `AG-28-F.test.ts` | — |
| `API-AG-29` | P1 | Exclusão de profissional com histórico | `tenantAuth` | 409 | `deleteProfessional` | `postCreateAppointment` | `Este profissional possui agendamentos e não pode ser excluído. Inative-o para preservar o histórico.` | `AG-29-F.test.ts` | — |
| `API-AG-30` | P2 | Gate do add-on de indicadores — substituído por API-ANL-03 : a rota saiu do contrato e o add-on appointment_analytics virou analytics | — | 404 | `GET /dashboard/appointments/analytics` *(não existe no contrato)* | — | — | coberto por `API-ANL-03` | — |
| `API-AG-31` | P0 | Crédito de pacote — venda e consumo | `tenantAuth` | 200 | `getPackageLedger` | `postCreatePackage`<br>`postSellPackage`<br>`postCreateAppointment` | — | `AG-31-F.test.ts` | — |
| `API-AG-31b` | P0 | Crédito de pacote — cancelamento e restauração excepcional | `tenantAuth` | 200 | `postExceptionalRestore` | `putSaveSettings`<br>`patchUpdateAppointmentStatus` | `Devolução excepcional:` | `AG-31b-F.test.ts` | — |
| `API-AG-32` | P0 | Notas internas não vazam para o app | `endUserAuth` | 200 | `getPublicMyAppointments` | `postCreateAppointment`<br>`postCreateBlock` | — | `AG-32-F.test.ts` | — |
| `API-AG-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getListAppointments` | — | — | `AG-XT-F.test.ts` | — |

## Formulários (`F`)

Domínio: `forms/` · casos: 25 (P0: 13)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-F-01` | P0 | Publicar sem pergunta | `tenantAuth` | 400 | `postPublish` | `postCreateForm` | — | `F-01-F.test.ts` | — |
| `API-F-02` | P0 | Ciclo completo de estados | `tenantAuth` | 200 | `postPublish` | `putReplaceQuestions`<br>`postUnpublish`<br>`postClose`<br>`postArchive` | — | `F-02-F.test.ts` | — |
| `API-F-03` | P0 | CLOSED é definitivo | `tenantAuth` | 400 | `postPublish` | `postClose`<br>`postDuplicate` | — | `F-03-F.test.ts` | — |
| `API-F-04` | P1 | Encerrar só a partir de publicado | `tenantAuth` | 401 | `postClose` | — | — | `F-04-F.test.ts` | — |
| `API-F-05` | P1 | Escolha com menos de duas opções | `tenantAuth` | 400 | `putReplaceQuestions` | — | — | `F-05-F.test.ts` | — |
| `API-F-06` | P2 | Título de pergunta acima do limite | `tenantAuth` | 400 | `putReplaceQuestions` | — | — | `F-06-F.test.ts` | — |
| `API-F-07` | P0 | PUT de perguntas substitui tudo | `tenantAuth` | 200 | `putReplaceQuestions` | `getListQuestions` | — | `F-07-F.test.ts` | — |
| `API-F-08` | P0 | Perguntas travadas após resposta | `tenantAuth` | 400 | `putReplaceQuestions` | `postPublicSubmitForm` | — | `F-08-F.test.ts` | — |
| `API-F-09` | P0 | Publicar para todos os ativos | `tenantAuth` | 200 | `postPublishToAllActive` | `getListFormAssignments` | — | `F-09-F.test.ts` | — |
| `API-F-10` | P0 | "Todos os ativos" é fotografia | `tenantAuth` | 200 | `getListFormAssignments` | `postPublishToAllActive`<br>`postCreatePerson` | — | `F-10-F.test.ts` | — |
| `API-F-11` | P1 | Atribuição reenviada | `tenantAuth` | 201 | `postAssignForm` | `postAssignForm` | — | `F-11-F.test.ts` | — |
| `API-F-12` | P1 | Estado da atribuição | `tenantAuth` | 200 | `getListFormAssignments` | `postAssignForm`<br>`postPublicSubmitForm` | `COMPLETED`<br>`AVAILABLE` | `F-12-F.test.ts` | — |
| `API-F-13` | P0 | Pessoa inválida aborta o lote inteiro | `tenantAuth` | 400 | `postAssignForm` | `getListFormAssignments` | — | `F-13-F.test.ts` | — |
| `API-F-14` | P1 | Envio por grupo | `tenantAuth` | 201 | `postAssignForm` | `postCreateGroup`<br>`postActivateGroup` | `GROUP` | `F-14-F.test.ts` | — |
| `API-F-15` | P0 | Submissão única repetida | `endUserAuth` | 409 | `postPublicSubmitForm` | `postPublicSubmitForm` | `trigger` | `F-15-F.test.ts` | — |
| `API-F-16` | P1 | Submissão múltipla permitida | `endUserAuth` | 201 | `postPublicSubmitForm` | `postPublicSubmitForm`<br>`getListAllSubmissions` | — | `F-16-F.test.ts` | — |
| `API-F-17` | P1 | Corpo de submissão inválido | `endUserAuth` | 400 | `postPublicSubmitForm` | — | — | `F-17-F.test.ts` | — |
| `API-F-18` | P0 | SPECIFIC esconde de quem não tem atribuição | `endUserAuth` | 200 | `getPublicMyForms` | `getPublicForm` | — | `F-18-F.test.ts` | — |
| `API-F-19` | P0 | Sensível sem autorização | `tenantAuth` | 403 | `getListFormSubmissions` | `patchSensitiveDataAccess` | `Você não possui a permissão para visualizar respostas sensíveis.` | `F-19-F.test.ts` | — |
| `API-F-20` | P0 | Filtro sensível antes da contagem | `tenantAuth` | 200 | `getListAllSubmissions` | — | — | `F-20-F.test.ts` | — |
| `API-F-21` | P1 | Auditoria de leitura sensível | `tenantAuth` | 200 | `getSubmission` | `getList` | — | `F-21-F.test.ts` | — |
| `API-F-22` | P1 | Paginação | `tenantAuth` | 200 | `getListAllSubmissions` | — | — | `F-22-F.test.ts` | — |
| `API-F-23` | P2 | Indicadores de escala | `tenantAuth` | 200 | `getFormInsights` | — | — | `F-23-F.test.ts` | — |
| `API-F-24` | P1 | Colisão de rota | `tenantAuth` | 200 | `getListAllSubmissions` | — | `submissions` | `F-24-F.test.ts` | — |
| `API-F-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getListForms` | — | — | `F-XT-F.test.ts` | — |

## Privacidade e LGPD (`LGPD`)

Domínio: `privacy/` · casos: 14 (P0: 11)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-LGPD-01` | P0 | Primeiro admin do tenant vira Principal | `platformAuth` | 201 | `postCreateAdmin` | `postCreateTenant` | — | `LGPD-01-F.test.ts` | — |
| `API-LGPD-02` | P0 | Principal legado sem a flag continua autorizado | `tenantAuth` | 200 | `getSubmission` | — | — | **não verificável** — verificação manual, uma vez, na migração : o estado só existe em base legada e a API não o constrói de propósito ( API-LGPD-06 ). Decisão registrada em #98 ([#98](https://github.com/pricaimiTech/dev.CrossHub/issues/98)) | — |
| `API-LGPD-03` | P0 | Só o Principal concede acesso | `tenantAuth` | 403 | `patchSensitiveDataAccess` | — | `Apenas o Administrador Principal pode alterar o acesso a dados sensíveis.` | `LGPD-03-F.test.ts` | — |
| `API-LGPD-04` | P0 | Leitura sem autorização | `tenantAuth` | 403 | `getSubmission` | — | `Você não possui a permissão para visualizar respostas sensíveis.` | `LGPD-04-F.test.ts` | — |
| `API-LGPD-05` | P0 | Envio sem autorização | `tenantAuth` | 403 | `postAssignForm` | — | — | `LGPD-05-F.test.ts` | — |
| `API-LGPD-06` | P0 | Acesso do Principal é irrevogável | `tenantAuth` | 409 | `patchSensitiveDataAccess` | — | `O Administrador Principal possui acesso permanente a dados sensíveis.` | `LGPD-06-F.test.ts` | — |
| `API-LGPD-07` | P0 | Alvo inválido | `tenantAuth` | 404 | `patchSensitiveDataAccess` | — | `Profissional não encontrado.` | `LGPD-07-F.test.ts` | — |
| `API-LGPD-08` | P1 | Autorização vale imediatamente | `tenantAuth` | 200 | `getSubmission` | `patchSensitiveDataAccess` | — | `LGPD-08-F.test.ts` | — |
| `API-LGPD-09` | P0 | Revogação vale imediatamente | `tenantAuth` | 403 | `getSubmission` | `patchSensitiveDataAccess` | — | `LGPD-09-F.test.ts` | — |
| `API-LGPD-10` | P0 | Limites da retenção | `tenantAuth` | 400 | `patchUpdateSettings` | — | `A retenção deve ser um número inteiro entre 1 e 3650 dias.` | `LGPD-10-F.test.ts` | — |
| `API-LGPD-11` | P0 | Execução da retenção | `tenantAuth` | 200 | `postRunRetention` | `patchUpdateSettings` | — | `LGPD-11-F.test.ts` | — |
| `API-LGPD-12` | P1 | Retenção independe da autorização | `tenantAuth` | 200 | `postRunRetention` | — | — | `LGPD-12-F.test.ts` | — |
| `API-LGPD-13` | P1 | Auditoria da mudança de acesso | `tenantAuth` | 200 | `patchSensitiveDataAccess` | `getList` | — | `LGPD-13-F.test.ts` | — |
| `API-LGPD-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getProfessionals` | `patchSensitiveDataAccess` | — | `LGPD-XT-F.test.ts` | — |

## Clientes (`C`)

Domínio: `people/` · casos: 18 (P0: 10)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-C-01` | P0 | Cadastro mínimo | `tenantAuth` | 201 | `postCreatePerson` | — | `active` | `C-01-F.test.ts` | — |
| `API-C-01b` | P1 | Cadastro sem e-mail é recusado | `tenantAuth` | 400 | `postCreatePerson` | — | `E-mail é obrigatório para cadastrar um cliente.` | `C-01b-F.test.ts` | — |
| `API-C-02` | P1 | Normalização de campos | `tenantAuth` | 201 | `postCreatePerson` | — | `maria@exemplo.com` | `C-02-F.test.ts` | — |
| `API-C-03` | P1 | Limites dos campos | `tenantAuth` | 400 | `postCreatePerson` | — | `Observações devem ter no máximo 500 caracteres.`<br>`Documento deve ter no máximo 40 caracteres.`<br>`Gênero inválido.`<br>`Data de nascimento inválida.` | `C-03-F.test.ts` | — |
| `API-C-04` | P0 | Código exige um canal de contato | `tenantAuth` | 409 | `postCreateCode` | — | — | `C-04-F.test.ts` | — |
| `API-C-05` | P0 | Um único código ativo | `tenantAuth` | 409 | `postCreateCode` | `postCreateCode` | — | `C-05-F.test.ts` | — |
| `API-C-06` | P0 | Regenerar revoga o anterior | `tenantAuth` | 201 | `postRegenerateCode` | `postCreateCode`<br>`postActivate` | — | `C-06-F.test.ts` | — |
| `API-C-07` | P0 | Texto puro exibido uma vez | `tenantAuth` | 201 | `postCreateCode` | — | — | `C-07-F.test.ts` | — |
| `API-C-08` | P1 | Código para pessoa revogada | `tenantAuth` | 409 | `postCreateCode` | `postRemoveAccess` | — | `C-08-F.test.ts` | — |
| `API-C-09` | P0 | Ativação completa | — | 200 | `postActivate` | `postCreateCode` | — | `C-09-F.test.ts` | — |
| `API-C-10` | P0 | Ativação inválida | — | 400 | `postActivate` | — | `O PIN deve ter de 4 a 6 dígitos.`<br>`Slug, código, senha e consentimento são obrigatórios.` | `C-10-F.test.ts` | — |
| `API-C-11` | P0 | socialName não sobrescreve name | — | 200 | `postActivate` | `getPublicSession` | `fallback` | `C-11-F.test.ts` | — |
| `API-C-12` | P0 | Remover acesso | `tenantAuth` | 200 | `postRemoveAccess` | `postPublicLogin` | `revoked` | `C-12-F.test.ts` | — |
| `API-C-13` | P1 | Foto — validações | `tenantAuth` | 400 | `postUploadPhoto` | — | `Envie JPEG, PNG ou WebP com até 5 MB.` | `C-13-F.test.ts` | — |
| `API-C-14` | P1 | Remover foto | `tenantAuth` | 200 | `patchUpdatePerson` | `postUploadPhoto` | — | `C-14-F.test.ts` | — |
| `API-C-15` | P1 | Auditoria | `tenantAuth` | 201 | `postCreatePerson` | `patchUpdatePerson`<br>`postCreateCode`<br>`postRegenerateCode`<br>`postRemoveAccess`<br>`getList` | — | `C-15-F.test.ts` | — |
| `API-C-16` | P1 | Volume sem paginação | `tenantAuth` | 200 | `getListPeople` | — | — | `C-16-F.test.ts` | — |
| `API-C-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getListPeople` | `patchUpdatePerson` | — | `C-XT-F.test.ts` | — |

## Home (`H`)

Domínio: `dashboard/` · casos: 12 (P0: 7)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-H-01` | P0 | Janela de 24 h nas reservas | `tenantAuth` | 200 | `getHome` | `postPublicReserveProduct`<br>`patchUpdateReservation`<br>`postBackdate` | — | `H-01-F.test.ts` | — |
| `API-H-02` | P1 | Janela de 7 dias nas pessoas | `tenantAuth` | 200 | `getHome` | `postCreatePerson`<br>`postBackdate` | — | `H-02-F.test.ts` | — |
| `API-H-03` | P0 | Janelas deslizantes das métricas | `tenantAuth` | 200 | `getHome` | `putSaveSettings` | — | `H-03-F.test.ts` | — |
| `API-H-04` | P0 | Limite de quatro ações | `tenantAuth` | 200 | `getHome` | — | — | `H-04-F.test.ts` | — |
| `API-H-05` | P1 | Contagem zero não vira ação | `tenantAuth` | 200 | `getHome` | — | — | `H-05-F.test.ts` | — |
| `API-H-06` | P1 | Feed limitado e deduplicado | `tenantAuth` | 200 | `getHome` | — | — | `H-06-F.test.ts` | — |
| `API-H-07` | P0 | Feed só com metadados | `tenantAuth` | 200 | `getHome` | `postPublicSubmitForm` | — | `H-07-F.test.ts` | — |
| `API-H-08` | P0 | Filtro sensível antes da contagem | `tenantAuth` | 200 | `getHome` | `patchSensitiveDataAccess` | — | `H-08-F.test.ts` | — |
| `API-H-09` | P1 | Alerta de atraso | `tenantAuth` | 200 | `getHome` | `postBackdate` | — | `H-09-F.test.ts` | — |
| `API-H-10` | P0 | Tenant vazio | `tenantAuth` | 200 | `getHome` | — | — | `H-10-F.test.ts` | — |
| `API-H-11` | P1 | Sessão do painel | `tenantAuth` | 200 | `getSession` | — | `tenant_admin` | `H-11-F.test.ts` | — |
| `API-H-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getHome` | — | — | `H-XT-F.test.ts` | — |

## Grupos (`G`)

Domínio: `groups/` · casos: 16 (P0: 8)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-G-01` | P0 | Criação manual | `tenantAuth` | 201 | `postCreateGroup` | — | — | `G-01-F.test.ts` | — |
| `API-G-02` | P1 | Manual exige ao menos uma pessoa | `tenantAuth` | 400 | `postCreateGroup` | — | `Selecione ao menos uma pessoa válida.` | `G-02-F.test.ts` | — |
| `API-G-03` | P0 | Pessoa de outro tenant | `tenantAuth` | 400 | `postCreateGroup` | `getListGroups` | — | `G-03-F.test.ts` | — |
| `API-G-04` | P0 | Origem formulário exige CLOSED | `tenantAuth` | 400 | `postCreateGroup` | — | — | `G-04-F.test.ts` | — |
| `API-G-05` | P0 | Dedupe por pessoa | `tenantAuth` | 201 | `postCreateGroup` | — | — | `G-05-F.test.ts` | — |
| `API-G-06` | P1 | Formulário sem respondente elegível | `tenantAuth` | 400 | `postCreateGroup` | — | — | `G-06-F.test.ts` | — |
| `API-G-07` | P0 | Distribuição sequencial e descarte do excedente | `tenantAuth` | 201 | `postCreateGroup` | — | — | `G-07-F.test.ts` | — |
| `API-G-08` | P1 | Estratégia é só rótulo | `tenantAuth` | 201 | `postCreateGroup` | — | — | `G-08-F.test.ts` | — |
| `API-G-08b` | P1 | Estratégia deixa de ser só rótulo quando há formulário | `tenantAuth` | 201 | `postCreateGroup` | — | — | `G-08b-F.test.ts` | — |
| `API-G-09` | P1 | Limites da divisão | `tenantAuth` | 400 | `postCreateGroup` | — | `A configuração de divisão é inválida.` | `G-09-F.test.ts` | — |
| `API-G-10` | P0 | Estados e integrantes | `tenantAuth` | 400 | `patchUpdateGroup` | — | — | `G-10-F.test.ts` | — |
| `API-G-11` | P1 | Ativação dedicada | `tenantAuth` | 400 | `postActivateGroup` | — | `Somente grupos em rascunho podem ser ativados.`<br>`Adicione participantes antes de ativar o grupo.` | `G-11-F.test.ts` | — |
| `API-G-12` | P0 | Grupo de formulário tem integrantes imutáveis | `tenantAuth` | 400 | `patchUpdateGroup` | — | — | `G-12-F.test.ts` | — |
| `API-G-13` | P1 | Edição substitui a composição | `tenantAuth` | 200 | `patchUpdateGroup` | — | — | `G-13-F.test.ts` | — |
| `API-G-14` | P1 | Transição livre de status | `tenantAuth` | 200 | `patchUpdateGroup` | — | — | `G-14-F.test.ts` | — |
| `API-G-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getListGroups` | `patchUpdateGroup`<br>`postActivateGroup` | — | `G-XT-F.test.ts` | — |

## Catálogo (`CAT`)

Domínio: `catalog/` · casos: 16 (P0: 12)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-CAT-01` | P0 | Nome de categoria único por tenant | `tenantAuth` | 409 | `postCreateCategory` | `postCreateCategory` | — | `CAT-01-F.test.ts` | — |
| `API-CAT-02` | P1 | Limites da categoria | `tenantAuth` | 400 | `postCreateCategory` | — | `O nome deve ter no máximo 60 caracteres.`<br>`A descrição deve ter no máximo 150 caracteres.`<br>`Ícone inválido.`<br>`briefcase` | `CAT-02-F.test.ts` | — |
| `API-CAT-03` | P0 | Categoria inativa não aceita vínculo | `tenantAuth` | 409 | `postCreateProduct` | `postCreateCategory`<br>`patchUpdateProduct` | `Selecione uma categoria ativa para vincular o produto.` | `CAT-03-F.test.ts` | — |
| `API-CAT-04` | P0 | Excluir categoria preserva produtos | `tenantAuth` | 200 | `deleteCategory` | `postCreateProduct`<br>`getProducts` | — | `CAT-04-F.test.ts` | — |
| `API-CAT-05` | P0 | Categoria de outro tenant | `tenantAuth` | 404 | `postCreateProduct` | — | `Categoria não encontrada.` | `CAT-05-F.test.ts` | — |
| `API-CAT-06` | P0 | Preço em centavos | `tenantAuth` | 400 | `postCreateProduct` | — | `Preço inválido.` | `CAT-06-F.test.ts` | — |
| `API-CAT-07` | P0 | Só produto ativo aparece e aceita reserva | — | 200 | `getPublicProducts` | `patchUpdateProduct`<br>`postPublicReserveProduct` | `Produto não encontrado.` | `CAT-07-F.test.ts` | — |
| `API-CAT-08` | P1 | Upload de imagem | `tenantAuth` | 400 | `postUpload` | — | `Envie JPEG, PNG ou WebP com até 5 MB.` | `CAT-08-F.test.ts` | — |
| `API-CAT-09` | P1 | Excluir produto limpa o armazenamento | `tenantAuth` | 200 | `deleteProduct` | `postUpload` | — | `CAT-09-F.test.ts` | — |
| `API-CAT-10` | P0 | Excluir produto com reserva histórica | `tenantAuth` | 200 | `deleteProduct` | `postPublicReserveProduct`<br>`patchUpdateReservation` | — | `CAT-10-F.test.ts` | — |
| `API-CAT-11` | P0 | Máquina de estados da reserva | `tenantAuth` | 200 | `patchUpdateReservation` | `postPublicReserveProduct` | `Essa alteração de status não é permitida.` | `CAT-11-F.test.ts` | — |
| `API-CAT-12` | P0 | Cancelamento pelo admin exige motivo | `tenantAuth` | 400 | `patchUpdateReservation` | — | `Informe o motivo do cancelamento.`<br>`O motivo deve ter no máximo 1000 caracteres.`<br>`admin` | `CAT-12-F.test.ts` | — |
| `API-CAT-13` | P0 | Cliente só cancela a própria, e só em pending | `endUserAuth` | 409 | `patchPublicCancelReservation` | `postPublicReserveProduct`<br>`patchUpdateReservation` | `A reserva só pode ser cancelada enquanto estiver nova.`<br>`client` | `CAT-13-F.test.ts` | — |
| `API-CAT-14` | P0 | Falha de e-mail não desfaz a reserva | `endUserAuth` | 201 | `postPublicReserveProduct` | — | — | `CAT-14-F.test.ts` | — |
| `API-CAT-15` | P2 | E-mail só com configuração completa | `endUserAuth` | 201 | `postPublicReserveProduct` | — | — | **não verificável** — verificação manual : exige a API no ar sem EMAIL_FROM , que é estado do processo, não de uma requisição. Decisão registrada em #123 ([#123](https://github.com/pricaimiTech/dev.CrossHub/issues/123)) | — |
| `API-CAT-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getProducts` | `patchUpdateProduct`<br>`getPublicProducts` | — | `CAT-XT-F.test.ts` | — |

## Marca e aparência (`MK`)

Domínio: `branding/` · casos: 12 (P0: 8)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-MK-01` | P0 | Upsert em registro único | `tenantAuth` | 200 | `putSaveBranding` | `putSaveBranding` | — | `MK-01-F.test.ts` | — |
| `API-MK-02` | P0 | Campos obrigatórios | `tenantAuth` | 400 | `putSaveBranding` | — | `O nome é obrigatório.`<br>`O tema deve ser \"dark\" ou \"light\".`<br>`O tema deve ser \`<br>` ou \` | `MK-02-F.test.ts` | — |
| `API-MK-03` | P0 | Formato da cor de destaque | `tenantAuth` | 400 | `putSaveBranding` | — | `Informe a cor de destaque em hexadecimal, no formato #RRGGBB.` | `MK-03-F.test.ts` | — |
| `API-MK-03b` | P0 | Tema derivado acompanha a resposta | `tenantAuth` | 200 | `putSaveBranding` | — | — | `MK-03b-F.test.ts` | — |
| `API-MK-04` | P1 | Substituição remove o ativo anterior | `tenantAuth` | 201 | `postUploadBranding` | — | — | `MK-04-F.test.ts` | — |
| `API-MK-05` | P0 | Remover ativo exige null explícito | `tenantAuth` | 200 | `putSaveBranding` | — | — | `MK-05-F.test.ts` | — |
| `API-MK-06` | P0 | Chave de outro tenant | `tenantAuth` | 400 | `putSaveBranding` | — | — | `MK-06-F.test.ts` | — |
| `API-MK-07` | P1 | Upload — tipo e tamanho | `tenantAuth` | 400 | `postUploadBranding` | — | `Envie JPEG, PNG ou WebP com até 5 MB.` | `MK-07-F.test.ts` | — |
| `API-MK-07b` | P1 | Upload assinado devolve URL temporária | `tenantAuth` | 200 | `putBrandingPresign` | — | — | `MK-07b-F.test.ts` | — |
| `API-MK-08` | P0 | Marca não zera o carrossel | `tenantAuth` | 200 | `putSaveBranding` | `patchBannerSettings`<br>`getBranding` | — | `MK-08-F.test.ts` | — |
| `API-MK-09` | P1 | Publicação no payload público | — | 200 | `getPublicTenant` | `putSaveBranding` | — | `MK-09-F.test.ts` | — |
| `API-MK-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getBranding` | `putSaveBranding` | — | `MK-XT-F.test.ts` | — |

## Banners (`BN`)

Domínio: `banners/` · casos: 11 (P0: 4)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-BN-01` | P0 | Limite de três ativos | `tenantAuth` | 400 | `postCreateBanner` | `postCreateBanner` | `Máximo de 3 banners ativos.` | `BN-01-F.test.ts` | — |
| `API-BN-02` | P0 | Ativar com o limite cheio | `tenantAuth` | 400 | `patchUpdateBanner` | — | — | `BN-02-F.test.ts` | — |
| `API-BN-03` | P1 | Imagem obrigatória na criação | `tenantAuth` | 400 | `postCreateBanner` | — | `Título e imagem são obrigatórios.` | `BN-03-F.test.ts` | — |
| `API-BN-04` | P1 | Formato do link | `tenantAuth` | 400 | `postCreateBanner` | — | `Link inválido.` | `BN-04-F.test.ts` | — |
| `API-BN-05` | P2 | Limites de texto | `tenantAuth` | 400 | `postCreateBanner` | — | `Texto do botão inválido.`<br>`Título e imagem são obrigatórios.` | `BN-05-F.test.ts` | — |
| `API-BN-06` | P0 | Reordenação exige o payload completo | `tenantAuth` | 400 | `patchReorderBanners` | `getListBanners` | `A lista de banners não confere.` | `BN-06-F.test.ts` | — |
| `API-BN-07` | P1 | Reordenação válida | `tenantAuth` | 200 | `patchReorderBanners` | `getListBanners` | — | `BN-07-F.test.ts` | — |
| `API-BN-08` | P1 | Configuração do carrossel | `tenantAuth` | 400 | `patchBannerSettings` | — | `Configurações do carrossel inválidas.` | `BN-08-F.test.ts` | — |
| `API-BN-09` | P1 | Substituir imagem deixa órfão | `tenantAuth` | 200 | `patchUpdateBanner` | `postUploadBanner` | — | `BN-09-F.test.ts` | — |
| `API-BN-10` | P1 | Só banner ativo chega ao app | — | 200 | `getPublicTenant` | `postCreateBanner`<br>`patchReorderBanners` | — | `BN-10-F.test.ts` | — |
| `API-BN-XT` | P0 | Isolamento entre tenants | `tenantAuth` | 200 | `getListBanners` | `patchUpdateBanner`<br>`deleteBanner`<br>`patchReorderBanners` | — | `BN-XT-F.test.ts` | — |

## Menu e navegação (`MN`)

Domínio: `dashboard/` · casos: 3 (P0: 2)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-MN-01` | P1 | Sessão | `tenantAuth` | 200 | `getSession` | `getProfessionals` | — | `MN-01-F.test.ts` | — |
| `API-MN-02` | P0 | Token inválido, expirado e de admin desativado | `tenantAuth` | 401 | `getSession` | `patchSetAdminStatus` | — | `MN-02-F.test.ts` | — |
| `API-MN-03` | P0 | Menu não é segurança | `tenantAuth` | 403 | `getListAllSubmissions` | — | — | `MN-03-F.test.ts` | — |

## Anonimização (`AN`)

Domínio: `privacy/` · casos: 4 (P0: 2)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-AN-01` | P1 | Rota de anonimização não existe | — | 404 | `POST /dashboard/privacy/people/{personId}/anonymization-requests` *(não existe no contrato)* | — | — | `AN-01-F.test.ts` | — |
| `API-AN-02` | P0 | Exclusão física de pessoa não existe | — | 404 | `DELETE /dashboard/people/{personId}` *(não existe no contrato)* | — | — | coberto por `API-AN-01` | — |
| `API-AN-03` | P0 | "Remover acesso" não é anonimizar | `tenantAuth` | 200 | `postRemoveAccess` | `getListPeople`<br>`getListFormAssignments` | `revoked` | `AN-03-F.test.ts` | — |
| `API-AN-04` | P2 | Auditoria não tem evento de anonimização | `tenantAuth` | 200 | `getListPeople` | `postRunRetention` | — | **não verificável** — o contrato não expõe leitura de trilha de auditoria ([#98](https://github.com/pricaimiTech/dev.CrossHub/issues/98)) | — |

## Analytics (`ANL`)

Domínio: `analytics/` · casos: 8 (P0: 4)

| Caso | Prio | Cenário | Token | Status | Service (ação) | Services (arranjo) | Asserção literal | Teste | Bug |
|---|---|---|---|---|---|---|---|---|---|
| `API-ANL-01` | P0 | Sessão declara add-ons e módulos (história AN-01) | `tenantAuth` | 200 | `getSession` | `putSaveTenantAddOns` | `analytics`<br>`active` | `ANL-01-F.test.ts` | — |
| `API-ANL-02` | P1 | Pedido de interesse idempotente em 7 dias (história AN-02) | `tenantAuth` | 201, 200 | `postRequestAnalyticsInterest` | `getPendingAnalyticsInterest`<br>`getTenantAddOnInterests`<br>`putSaveTenantAddOns` | `pending`<br>`analytics` | `ANL-02-F.test.ts` | — |
| `API-ANL-03` | P0 | Gate do add-on nas rotas do Analytics (história AN-03) | `tenantAuth` | 403 | `getAppointmentsAnalytics` | `getAppointmentsAnalyticsExport`<br>`getCustomersAnalytics`<br>`getCustomersAnalyticsExport`<br>`putSaveTenantAddOns` | `O add-on Analytics não está ativo para esta organização.` | `ANL-03-F.test.ts` | — |
| `API-ANL-03b` | P0 | Ocupação de 40% (história AN-03) | `tenantAuth` | 200 | `getAppointmentsAnalytics` | `putSaveTenantAddOns`<br>`postCreateProfessional`<br>`putSaveProfessionalAvailability`<br>`postCreateService`<br>`putSetProfessionals`<br>`getAvailability`<br>`postCreatePerson`<br>`postCreateAppointment` | — | `ANL-03b-F.test.ts` | — |
| `API-ANL-03c` | P1 | Bloqueio reduz o denominador (história AN-03) | `tenantAuth` | 200 | `getAppointmentsAnalytics` | `postCreateBlock`<br>`postCreateProfessional`<br>`putSaveProfessionalAvailability`<br>`postCreateService`<br>`postCreateAppointment` | — | `ANL-03c-F.test.ts` | — |
| `API-ANL-04` | P1 | Período acima de 12 meses (história AN-03) | `tenantAuth` | 400 | `getAppointmentsAnalytics` | `putSaveTenantAddOns` | `Período máximo de 12 meses.` | `ANL-04-F.test.ts` | — |
| `API-ANL-05` | P0 | Dado sensível na aba Clientes (história AN-05) | `tenantAuth` | 200 | `getCustomersAnalytics` | `putSaveTenantAddOns`<br>`patchSensitiveDataAccess`<br>`postCreatePerson`<br>`postCreateAppointment` | — | `ANL-05-F.test.ts` | — |
| `API-ANL-06` | P1 | Ativar o add-on atende o pedido pendente (história AN-06) | `platformAuth` | 200 | `putSaveTenantAddOns` | `postRequestAnalyticsInterest`<br>`getTenantAddOnInterests` | `active` | `ANL-06-F.test.ts` | — |

## Bugs abertos pela automação

Nenhum bug aberto no momento.


## Casos sem teste

**3 de 175** casos da estratégia não têm arquivo de teste: 0 ausente(s) e 3 não verificável(is) contra o contrato atual.

### Não verificáveis contra o contrato (3)

Descritos na estratégia e sem rota que os torne observáveis. Saem daqui quando a
issue correspondente for resolvida — não antes, e não por serem esquecidos.

| Caso | Prio | Cenário | Motivo |
|---|---|---|---|
| `API-LGPD-02` | P0 | Principal legado sem a flag continua autorizado | verificação manual, uma vez, na migração : o estado só existe em base legada e a API não o constrói de propósito ( API-LGPD-06 ). Decisão registrada em #98 ([#98](https://github.com/pricaimiTech/dev.CrossHub/issues/98)) |
| `API-CAT-15` | P2 | E-mail só com configuração completa | verificação manual : exige a API no ar sem EMAIL_FROM , que é estado do processo, não de uma requisição. Decisão registrada em #123 ([#123](https://github.com/pricaimiTech/dev.CrossHub/issues/123)) |
| `API-AN-04` | P2 | Auditoria não tem evento de anonimização | o contrato não expõe leitura de trilha de auditoria ([#98](https://github.com/pricaimiTech/dev.CrossHub/issues/98)) |

## Testes fora da estratégia

Nenhum. Todo arquivo no disco corresponde a um caso da estratégia.

## Cobertura do contrato

Rotas citadas por algum caso: **97** de 146 do contrato.

### Rotas `/dashboard/**` sem nenhum caso de API (23 de 101)

- `DELETE /dashboard/appointments/blocks/{id}` → `appointments/deleteBlock`
- `DELETE /dashboard/appointments/services/{id}` → `appointments/deleteService`
- `DELETE /dashboard/forms/{id}` → `forms/deleteForm`
- `GET /dashboard/appointments/blocks` → `appointments/getBlocks`
- `GET /dashboard/appointments/packages` → `appointments/getPackages`
- `GET /dashboard/appointments/people/{personId}/financial-summary` → `appointments/getPersonFinancialSummary`
- `GET /dashboard/appointments/people/{personId}/packages` → `appointments/getPersonPackages`
- `GET /dashboard/appointments/professionals` → `appointments/getProfessionals`
- `GET /dashboard/appointments/professionals/{id}/availability` → `appointments/getProfessionalAvailability`
- `GET /dashboard/appointments/services` → `appointments/getServices`
- `GET /dashboard/appointments/settings` → `appointments/getSettings`
- `GET /dashboard/appointments/{id}/financial` → `appointments/getFinancial`
- `GET /dashboard/categories` → `catalog/getCategories`
- `GET /dashboard/privacy/settings` → `privacy/getSettings`
- `GET /dashboard/reservations` → `catalog/getReservations`
- `PATCH /dashboard/appointments/professionals/{id}` → `appointments/patchUpdateProfessional`
- `PATCH /dashboard/appointments/services/{id}` → `appointments/patchUpdateService`
- `PATCH /dashboard/appointments/{id}/edit` → `appointments/patchEditAppointment`
- `PATCH /dashboard/appointments/{id}/financial` → `appointments/patchAdjustFinancial`
- `PATCH /dashboard/categories/{id}` → `catalog/patchUpdateCategory`
- `PATCH /dashboard/forms/{id}` → `forms/patchUpdateForm`
- `POST /dashboard/appointments/{id}/payments` → `appointments/postRegisterPayment`
- `POST /dashboard/appointments/{id}/refunds` → `appointments/postRefundPayment`
