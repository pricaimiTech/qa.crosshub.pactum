/*
 * Massa de demonstração — clínica de fisioterapia e treinamento.
 *
 * Monta um tenant completo em develop apenas pela API pública do produto
 * (não há acesso direto ao banco de develop): organização, admin, add-on
 * Analytics, profissionais com grade, serviços com preço por profissional,
 * pacotes com desconto, clientes e agendamentos em todos os estados
 * financeiros que a demonstração precisa mostrar.
 *
 *   node --env-file=.env.develop scripts/seed-demo-clinica.mjs
 *
 * Idempotência: reaproveita o tenant quando o slug já existe e reaproveita
 * profissionais, serviços, pacotes e pessoas por nome/e-mail. Agendamentos
 * NÃO são reaproveitados — rodar duas vezes cria massa duplicada. Para
 * recomeçar limpo, use um DEMO_SLUG novo.
 *
 * Limite do ambiente: a API só aceita agendamento em horário futuro
 * (`chooseSlot` descarta slot no passado) e a rota de backdate envelhece
 * apenas `created_at`, não `starts_at`. Logo, TODA a agenda desta massa fica
 * nos próximos dias úteis — inclusive as sessões marcadas como concluídas.
 * No Analytics, filtre um período que cubra de hoje até ~40 dias à frente.
 */

const BASE_URL = strip(process.env.BASE_URL) ?? 'https://api.dev.crosshub.app.br';
const PLATFORM_EMAIL = strip(process.env.ADMIN_EMAIL);
const PLATFORM_PASSWORD = strip(process.env.ADMIN_PASSWORD);

const DEMO = {
  slug: strip(process.env.DEMO_SLUG) ?? 'clinica-movimento',
  name: 'Clínica Movimento — Fisioterapia & Treinamento',
  contactEmail: 'contato@clinicamovimento.com.br',
  contactPhone: '(51) 3222-8100',
  admin: {
    name: 'Renata Vasques',
    email: 'renata.vasques@clinicamovimento.com.br',
    phone: '(51) 99811-2200',
    jobTitle: 'Administradora da clínica',
    password: strip(process.env.DEMO_ADMIN_PASSWORD),
  },
};

/* Preços em centavos. Fisioterapia: R$200 com os fisioterapeutas de meio
 * período, R$450 com a dona da clínica. Treino personal: R$150. */
const PRICE = { fisio: 20_000, fisioOwner: 45_000, personal: 15_000 };
const PACKAGE_DISCOUNT = 0.3;
const pkgPrice = (unit) => Math.round(unit * 10 * (1 - PACKAGE_DISCOUNT));

/* Grade da clínica: 07:00–12:00 e 13:00–19:00, sessões de 60 min sem
 * intervalo. O último atendimento começa às 18:00 e fecha às 19:00. */
const MORNING = { shift: 'morning', startTime: '07:00', endTime: '12:00' };
const AFTERNOON = { shift: 'afternoon', startTime: '13:00', endTime: '19:00' };
const WEEK = [1, 2, 3, 4, 5];
const rules = (days, ...shifts) => days.flatMap((weekday) => shifts.map((shift) => ({ weekday, ...shift })));

const PROFESSIONALS = {
  marina: {
    name: 'Dra. Marina Prado (dona · integral)',
    availability: rules(WEEK, MORNING, AFTERNOON),
  },
  thiago: {
    name: 'Dr. Thiago Ramos (meio período)',
    availability: rules([1, 3], MORNING),
  },
  camila: {
    name: 'Dra. Camila Ferraz (meio período)',
    availability: rules([2, 4], AFTERNOON),
  },
  lucas: {
    name: 'Lucas Andrade (personal · manhã)',
    availability: rules(WEEK, MORNING),
  },
  bianca: {
    name: 'Bianca Rocha (personal · tarde)',
    availability: rules(WEEK, AFTERNOON),
  },
};

const SERVICES = {
  fisio: {
    name: 'Sessão de Fisioterapia',
    description: 'Atendimento individual de 60 minutos.',
    approvalMode: 'manual',
    professionalSelectionMode: 'required',
    unitPriceCents: PRICE.fisio,
    professionals: [
      { key: 'marina', unitPriceCents: PRICE.fisioOwner },
      { key: 'thiago', unitPriceCents: null },
      { key: 'camila', unitPriceCents: null },
    ],
  },
  personal: {
    name: 'Treino com Personal',
    description: 'Treino individual de 60 minutos.',
    approvalMode: 'manual',
    professionalSelectionMode: 'required',
    unitPriceCents: PRICE.personal,
    professionals: [
      { key: 'lucas', unitPriceCents: null },
      { key: 'bianca', unitPriceCents: null },
    ],
  },
};

const PACKAGES = {
  fisio10: {
    name: 'Fisioterapia — 10 sessões (30% off)',
    priceCents: pkgPrice(PRICE.fisio),
    totalCredits: 10,
    validityDays: 120,
    service: 'fisio',
  },
  fisioPremium10: {
    name: 'Fisioterapia Premium com a Dra. Marina — 10 sessões (30% off)',
    priceCents: pkgPrice(PRICE.fisioOwner),
    totalCredits: 10,
    validityDays: 120,
    service: 'fisio',
  },
  personal10: {
    name: 'Treino Personal — 10 sessões (30% off)',
    priceCents: pkgPrice(PRICE.personal),
    totalCredits: 10,
    validityDays: 120,
    service: 'personal',
  },
};

/*
 * Os dez clientes cobrem, de propósito, cada combinação que a demonstração
 * precisa mostrar: pacote em uso, pacote esgotado, pacote pago pela metade,
 * dois pacotes na mesma pessoa, avulso pago, avulso em aberto, avulso pago
 * pela metade, falta com multa e cancelamento pela clínica.
 */
const CLIENTS = [
  {
    key: 'ana',
    name: 'Ana Beatriz Moraes',
    email: 'ana.moraes@exemplo.com.br',
    phone: '(51) 99100-0101',
    note: 'Pacote de fisioterapia pago à vista, em uso.',
    packages: [{ package: 'fisio10', pay: 'full' }],
    appointments: [
      { service: 'fisio', professional: 'thiago', usePackage: 'fisio10', outcome: 'completed', count: 3 },
      { service: 'fisio', professional: 'camila', usePackage: 'fisio10', outcome: 'pending' },
    ],
  },
  {
    key: 'bruno',
    name: 'Bruno Carvalho',
    email: 'bruno.carvalho@exemplo.com.br',
    phone: '(51) 99100-0102',
    note: 'Consumiu as 10 sessões do pacote e voltou a agendar avulso.',
    packages: [{ package: 'fisio10', pay: 'full' }],
    appointments: [
      { service: 'fisio', professional: 'thiago', usePackage: 'fisio10', outcome: 'completed', count: 5 },
      { service: 'fisio', professional: 'camila', usePackage: 'fisio10', outcome: 'completed', count: 5 },
      { service: 'fisio', professional: 'camila', outcome: 'pending' },
    ],
  },
  {
    key: 'carla',
    name: 'Carla Nunes',
    email: 'carla.nunes@exemplo.com.br',
    phone: '(51) 99100-0103',
    note: 'Pacote de personal em uso, com uma falta que consumiu o crédito.',
    packages: [{ package: 'personal10', pay: 'full' }],
    appointments: [
      { service: 'personal', professional: 'lucas', usePackage: 'personal10', outcome: 'completed', count: 4 },
      { service: 'personal', professional: 'lucas', usePackage: 'personal10', outcome: 'no_show', reason: 'Não compareceu e avisou depois do horário.' },
      { service: 'personal', professional: 'bianca', usePackage: 'personal10', outcome: 'approved' },
    ],
  },
  {
    key: 'diego',
    name: 'Diego Salles',
    email: 'diego.salles@exemplo.com.br',
    phone: '(51) 99100-0104',
    note: 'Dois pacotes: fisioterapia pago pela metade e personal pago à vista.',
    packages: [
      { package: 'fisio10', pay: 'half' },
      { package: 'personal10', pay: 'full' },
    ],
    appointments: [
      { service: 'fisio', professional: 'thiago', usePackage: 'fisio10', outcome: 'completed', count: 2 },
      { service: 'personal', professional: 'bianca', usePackage: 'personal10', outcome: 'completed', count: 2 },
      { service: 'fisio', professional: 'camila', usePackage: 'fisio10', outcome: 'pending' },
    ],
  },
  {
    key: 'elisa',
    name: 'Elisa Faria',
    email: 'elisa.faria@exemplo.com.br',
    phone: '(51) 99100-0105',
    note: 'Pacote premium com a dona da clínica, pago à vista.',
    packages: [{ package: 'fisioPremium10', pay: 'full' }],
    appointments: [
      { service: 'fisio', professional: 'marina', usePackage: 'fisioPremium10', outcome: 'completed', count: 2 },
      { service: 'fisio', professional: 'marina', usePackage: 'fisioPremium10', outcome: 'approved' },
    ],
  },
  {
    key: 'fabio',
    name: 'Fábio Menezes',
    email: 'fabio.menezes@exemplo.com.br',
    phone: '(51) 99100-0106',
    note: 'Sem pacote: agendou avulso e paga no atendimento.',
    packages: [],
    appointments: [{ service: 'fisio', professional: 'thiago', outcome: 'pending' }],
  },
  {
    key: 'gabriela',
    name: 'Gabriela Lopes',
    email: 'gabriela.lopes@exemplo.com.br',
    phone: '(51) 99100-0107',
    note: 'Sem pacote: sessão avulsa concluída e paga por Pix.',
    packages: [],
    appointments: [{ service: 'fisio', professional: 'camila', outcome: 'completed', pay: { amount: 'full', method: 'pix' } }],
  },
  {
    key: 'henrique',
    name: 'Henrique Dias',
    email: 'henrique.dias@exemplo.com.br',
    phone: '(51) 99100-0108',
    note: 'Sem pacote: avulso com a dona da clínica, pago pela metade.',
    packages: [],
    appointments: [{ service: 'fisio', professional: 'marina', outcome: 'approved', pay: { amount: 'half', method: 'credit_card' } }],
  },
  {
    key: 'isabela',
    name: 'Isabela Prado',
    email: 'isabela.prado@exemplo.com.br',
    phone: '(51) 99100-0109',
    note: 'Sem pacote: um treino em aberto e uma falta com multa de 50%.',
    packages: [],
    appointments: [
      { service: 'personal', professional: 'bianca', outcome: 'approved' },
      {
        service: 'personal',
        professional: 'lucas',
        outcome: 'no_show',
        reason: 'Falta sem aviso — multa de 50% aplicada.',
        penalty: { percent: 0.5, method: 'pix' },
      },
    ],
  },
  {
    key: 'joao',
    name: 'João Vitor Braga',
    email: 'joao.braga@exemplo.com.br',
    phone: '(51) 99100-0110',
    note: 'Sem pacote: treino avulso pago e um cancelamento pela clínica.',
    packages: [],
    appointments: [
      { service: 'personal', professional: 'lucas', outcome: 'completed', pay: { amount: 'full', method: 'cash' } },
      { service: 'personal', professional: 'bianca', outcome: 'cancelled_by_admin', reason: 'Profissional remanejado; cliente reagendará.' },
    ],
  },
];

// --- HTTP -------------------------------------------------------------------

function strip(value) {
  const text = value?.trim();
  if (!text) return undefined;
  return text.replace(/^['"]|['"]$/g, '');
}

const money = (cents) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

let token = null;

async function api(method, path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(`${method} ${path} → ${response.status} ${text.slice(0, 400)}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

const list = (payload) => (Array.isArray(payload) ? payload : (payload?.items ?? payload?.data ?? []));

// --- Grade de horários ------------------------------------------------------

/*
 * O agendamento precisa cair exatamente no início de um slot que a própria
 * API considere livre, então a massa nunca inventa horário: pede a
 * disponibilidade dia a dia e escolhe o primeiro slot do profissional que
 * ainda não foi usado nesta execução. `taken` existe porque vários
 * agendamentos são criados antes de a API recontar a ocupação da janela.
 */
const taken = new Set();
const cursors = new Map();

function isoDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function nextSlot(serviceId, professionalId, startOffset) {
  const from = Math.max(startOffset, cursors.get(professionalId) ?? 1);
  for (let offset = from; offset <= from + 60; offset += 1) {
    const date = isoDate(offset);
    const { slots } = await api('GET', `/dashboard/appointments/availability?serviceId=${serviceId}&date=${date}`);
    const free = slots
      .filter((slot) => slot.professionalId === professionalId && slot.occupied < slot.capacity && !taken.has(`${professionalId}|${slot.startsAt}`))
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt))[0];
    if (free) {
      taken.add(`${professionalId}|${free.startsAt}`);
      cursors.set(professionalId, offset);
      return free;
    }
    cursors.set(professionalId, offset + 1);
  }
  throw new Error(`Sem horário livre para o profissional ${professionalId} nos próximos 60 dias.`);
}

// --- Passos -----------------------------------------------------------------

async function platformLogin() {
  if (!PLATFORM_EMAIL || !PLATFORM_PASSWORD) throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos (use --env-file=.env.develop).');
  if (!DEMO.admin.password) throw new Error('DEMO_ADMIN_PASSWORD deve estar definida: o script cria um admin real em develop, e senha padrão no repositório é credencial publicada.');
  const session = await api('POST', '/auth/platform/login', { email: PLATFORM_EMAIL, password: PLATFORM_PASSWORD });
  token = session.accessToken;
}

async function ensureTenant() {
  const existing = list(await api('GET', '/admin/tenants')).find((tenant) => tenant.slug === DEMO.slug);
  if (existing) {
    if (existing.status !== 'active') await api('PATCH', `/admin/tenants/${existing.id}`, { status: 'active' });
    return { tenant: existing, created: false };
  }
  const plans = list(await api('GET', '/admin/plans'));
  const plan =
    plans.find((item) => item.slug === 'plano-full') ??
    plans.filter((item) => item.isActive).sort((left, right) => right.includedModules.length - left.includedModules.length)[0];
  if (!plan) throw new Error('Nenhum plano ativo disponível para vincular à organização.');
  const tenant = await api('POST', '/admin/tenants', {
    name: DEMO.name,
    slug: DEMO.slug,
    planId: plan.id,
    status: 'active',
    contactEmail: DEMO.contactEmail,
    contactPhone: DEMO.contactPhone,
    enabledModules: plan.includedModules,
  });
  return { tenant, created: true };
}

async function ensureTenantAdmin(tenantId) {
  const admins = list(await api('GET', `/admin/tenants/${tenantId}/admins`));
  const existing = admins.find((admin) => admin.email?.toLowerCase() === DEMO.admin.email.toLowerCase());
  if (existing) {
    await api('PATCH', `/admin/tenants/${tenantId}/admins/${existing.id}/password`, { password: DEMO.admin.password });
    return { admin: existing, created: false };
  }
  const admin = await api('POST', `/admin/tenants/${tenantId}/admins`, DEMO.admin);
  return { admin, created: true };
}

async function ensureAnalyticsAddOn(tenantId) {
  const catalog = list(await api('GET', '/admin/add-ons'));
  const analytics = catalog.find((addOn) => addOn.code === 'analytics');
  if (!analytics) return { granted: false, reason: 'Add-on `analytics` não existe no catálogo deste ambiente.' };
  await api('PUT', `/admin/add-ons/tenants/${tenantId}`, {
    addOnId: analytics.id,
    status: 'active',
    referencePriceCents: analytics.priceCents ?? 0,
  });
  return { granted: true };
}

async function tenantLogin() {
  const session = await api('POST', '/auth/platform/tenant/login', {
    slug: DEMO.slug,
    email: DEMO.admin.email,
    password: DEMO.admin.password,
  });
  token = session.accessToken;
}

async function saveSettings() {
  /* Cancelamento com menos de 24 h não devolve o crédito do pacote, e a
   * falta também não — é assim que a política da clínica ("perde a sessão")
   * fica valendo no produto. Cancelamento pela clínica devolve. */
  await api('PUT', '/dashboard/appointments/settings', {
    timezone: 'America/Sao_Paulo',
    cancellationNoticeHours: 24,
    restoreCreditOnLateCancellation: false,
    restoreCreditOnNoShow: false,
    restoreCreditOnAdminCancellation: true,
  });
}

async function ensureProfessionals() {
  const existing = list(await api('GET', '/dashboard/appointments/professionals'));
  const result = {};
  for (const [key, config] of Object.entries(PROFESSIONALS)) {
    const found = existing.find((professional) => professional.name === config.name);
    const professional = found ?? (await api('POST', '/dashboard/appointments/professionals', { name: config.name, isActive: true }));
    await api('PUT', `/dashboard/appointments/professionals/${professional.id}/availability`, { rules: config.availability });
    result[key] = { ...professional, key };
  }
  return result;
}

async function ensureServices(professionals) {
  const existing = list(await api('GET', '/dashboard/appointments/services'));
  const result = {};
  for (const [key, config] of Object.entries(SERVICES)) {
    const found = existing.find((service) => service.name === config.name);
    const payload = {
      name: config.name,
      description: config.description,
      approvalMode: config.approvalMode,
      professionalSelectionMode: config.professionalSelectionMode,
      unitPriceCents: config.unitPriceCents,
      isActive: true,
    };
    const service = found
      ? await api('PATCH', `/dashboard/appointments/services/${found.id}`, payload)
      : await api('POST', '/dashboard/appointments/services', payload);
    await api('PUT', `/dashboard/appointments/services/${service.id ?? found.id}/professionals`, {
      professionals: config.professionals.map((link, index) => ({
        professionalId: professionals[link.key].id,
        durationMinutes: 60,
        intervalMinutes: 0,
        capacity: 1,
        sortOrder: index,
        ...(link.unitPriceCents === null ? {} : { unitPriceCents: link.unitPriceCents }),
      })),
    });
    result[key] = { ...(service ?? found), id: service?.id ?? found.id, key };
  }
  return result;
}

async function ensurePackages(services) {
  const existing = list(await api('GET', '/dashboard/appointments/packages'));
  const result = {};
  for (const [key, config] of Object.entries(PACKAGES)) {
    const found = existing.find((item) => item.name === config.name);
    const pack =
      found ??
      (await api('POST', '/dashboard/appointments/packages', {
        name: config.name,
        priceCents: config.priceCents,
        totalCredits: config.totalCredits,
        validityDays: config.validityDays,
        isActive: true,
        services: [{ serviceId: services[config.service].id, creditsPerSession: 1 }],
      }));
    result[key] = { ...pack, key, priceCents: pack.priceCents ?? config.priceCents };
  }
  return result;
}

async function ensurePeople() {
  const existing = list(await api('GET', '/dashboard/people'));
  const result = {};
  for (const client of CLIENTS) {
    const found = existing.find((person) => person.email?.toLowerCase() === client.email.toLowerCase());
    const person =
      found ??
      (await api('POST', '/dashboard/people', {
        name: client.name,
        email: client.email,
        phone: client.phone,
        notes: client.note,
        status: 'active',
      }));
    result[client.key] = { ...person, key: client.key };
  }
  return result;
}

async function sellPackages(people, packages) {
  const contracts = {};
  for (const client of CLIENTS) {
    contracts[client.key] = {};
    for (const sale of client.packages) {
      const pack = packages[sale.package];
      const paymentAmountCents = sale.pay === 'full' ? pack.priceCents : sale.pay === 'half' ? Math.round(pack.priceCents / 2) : 0;
      const contract = await api('POST', `/dashboard/appointments/people/${people[client.key].id}/packages`, {
        packageId: pack.id,
        ...(paymentAmountCents > 0 ? { paymentAmountCents, paymentMethod: 'pix', paymentNotes: 'Venda de pacote — massa de demonstração.' } : {}),
      });
      const id = contract.contract?.id ?? contract.id;
      contracts[client.key][sale.package] = { id, priceCents: pack.priceCents, paidCents: paymentAmountCents };
    }
  }
  return contracts;
}

async function createAppointments(people, services, contracts) {
  const created = [];
  for (const client of CLIENTS) {
    const person = people[client.key];
    let offset = 1;
    for (const plan of client.appointments) {
      for (let index = 0; index < (plan.count ?? 1); index += 1) {
        const service = services[plan.service];
        const professionalId = plan.professional;
        const contract = plan.usePackage ? contracts[client.key][plan.usePackage] : null;
        const slot = await nextSlot(service.id, professionalId, offset);
        offset = 1;
        const appointment = await api('POST', '/dashboard/appointments', {
          personId: person.id,
          serviceId: service.id,
          professionalId,
          startsAt: slot.startsAt,
          notes: `DEMO · ${client.name} · ${plan.usePackage ? 'pacote' : 'avulso'}`,
          ...(contract ? { packageContractId: contract.id } : {}),
        });

        // pending → approved → completed / no_show; cancelled_by_admin sai de pending.
        if (plan.outcome === 'approved' || plan.outcome === 'completed' || plan.outcome === 'no_show') {
          await api('PATCH', `/dashboard/appointments/${appointment.id}`, { status: 'approved' });
        }
        if (plan.outcome === 'completed') await api('PATCH', `/dashboard/appointments/${appointment.id}`, { status: 'completed' });
        if (plan.outcome === 'no_show') await api('PATCH', `/dashboard/appointments/${appointment.id}`, { status: 'no_show', reason: plan.reason });
        if (plan.outcome === 'cancelled_by_admin') await api('PATCH', `/dashboard/appointments/${appointment.id}`, { status: 'cancelled_by_admin', reason: plan.reason });

        /* Multa de falta: o total do atendimento passa a ser 50% do valor,
         * via ajuste financeiro, e o pagamento da multa quita o registro. */
        if (plan.penalty) {
          const discountCents = Math.round(appointment.unitPriceCents * (1 - plan.penalty.percent));
          const financial = await api('PATCH', `/dashboard/appointments/${appointment.id}/financial`, {
            discountCents,
            surchargeCents: 0,
            waive: false,
            reason: `Multa de ${plan.penalty.percent * 100}% por falta sem aviso.`,
          });
          const totalCents = financial.totalCents ?? appointment.unitPriceCents - discountCents;
          await api('POST', `/dashboard/appointments/${appointment.id}/payments`, {
            amountCents: totalCents,
            method: plan.penalty.method,
            notes: 'Pagamento da multa de cancelamento tardio.',
          });
        }

        if (plan.pay) {
          const amountCents = plan.pay.amount === 'full' ? appointment.totalCents : Math.round(appointment.totalCents / 2);
          await api('POST', `/dashboard/appointments/${appointment.id}/payments`, {
            amountCents,
            method: plan.pay.method,
            notes: 'Pagamento registrado no atendimento.',
          });
        }

        created.push({
          client: client.name,
          service: service.name,
          startsAt: slot.startsAt,
          outcome: plan.outcome,
          package: plan.usePackage ?? null,
          totalCents: appointment.totalCents,
        });
      }
    }
  }
  return created;
}

async function report(people, packages, appointments) {
  const from = isoDate(-1);
  const to = isoDate(70);
  const nameByPackageId = Object.fromEntries(Object.values(packages).map((pack) => [pack.id, pack.name]));
  const balances = {};
  for (const client of CLIENTS) {
    const summary = await api('GET', `/dashboard/appointments/people/${people[client.key].id}/financial-summary`);
    const contracts = list(await api('GET', `/dashboard/appointments/people/${people[client.key].id}/packages`));
    const packs = [];
    for (const contract of contracts) {
      // O saldo do contrato é a soma do extrato: `grant` credita, `consume`
      // debita, `restore` devolve. O DTO do contrato não traz saldo.
      const ledger = list(await api('GET', `/dashboard/appointments/package-contracts/${contract.id}/ledger`));
      const remaining = ledger.reduce((total, entry) => total + entry.deltaCredits, 0);
      packs.push(
        `${nameByPackageId[contract.packageId] ?? 'pacote'}: ${remaining} de ${contract.totalCredits} créditos · pago ${money(contract.paidCents ?? 0)} de ${money(contract.totalCents)}`,
      );
    }
    balances[client.name] = {
      recebido: money(summary.receivedCents),
      emAberto: money(summary.outstandingCents),
      concluidos: summary.completedAppointments,
      pacotes: packs,
    };
  }
  let analytics = null;
  try {
    const data = await api('GET', `/dashboard/analytics/appointments?from=${from}&to=${to}`);
    analytics = {
      periodo: `${from} → ${to}`,
      recebido: money(data.cards.receivedCents),
      emAberto: money(data.cards.outstandingCents),
      ocupacaoPercent: data.cards.occupancyPercent,
      faltas: data.cards.noShowCount,
    };
  } catch (error) {
    analytics = { erro: error.message };
  }
  return { analytics, balances, totalAgendamentos: appointments.length };
}

// --- Execução ---------------------------------------------------------------

await platformLogin();
const { tenant, created: tenantCreated } = await ensureTenant();
const { created: adminCreated } = await ensureTenantAdmin(tenant.id);
const addOn = await ensureAnalyticsAddOn(tenant.id);

await tenantLogin();
await saveSettings();
const professionalRows = await ensureProfessionals();
const services = await ensureServices(professionalRows);
const packages = await ensurePackages(services);
const people = await ensurePeople();
const contracts = await sellPackages(people, packages);

// A partir daqui os planos citam profissionais por id, não por chave.
const professionalIds = Object.fromEntries(Object.entries(professionalRows).map(([key, row]) => [key, row.id]));
for (const client of CLIENTS) for (const plan of client.appointments) plan.professional = professionalIds[plan.professional];

const appointments = await createAppointments(people, services, contracts);
const summary = await report(people, packages, appointments);

console.log(
  JSON.stringify(
    {
      ambiente: BASE_URL,
      organizacao: { nome: DEMO.name, slug: DEMO.slug, id: tenant.id, criadaAgora: tenantCreated },
      acesso: {
        dashboard: `https://dash.dev.crosshub.app.br (slug ${DEMO.slug})`,
        email: DEMO.admin.email,
        senha: DEMO.admin.password,
        adminCriadoAgora: adminCreated,
      },
      analyticsAddOn: addOn,
      catalogo: {
        profissionais: Object.values(professionalRows).map((item) => item.name),
        servicos: Object.values(services).map((item) => item.name),
        pacotes: Object.values(packages).map((item) => `${item.name} — ${money(item.priceCents)}`),
      },
      ...summary,
    },
    null,
    2,
  ),
);
