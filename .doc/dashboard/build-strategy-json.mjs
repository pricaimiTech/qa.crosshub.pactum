#!/usr/bin/env node
/**
 * Emite `estrategia-testes-dashboard.json` a partir do HTML da estratégia.
 *
 * O HTML continua sendo a fonte — é onde o caso é escrito e revisado. O JSON é
 * artefato de build, para o projeto de automação parar de raspar HTML: sem ele,
 * o casamento entre caso e endpoint depende de heurística de sufixo, que é
 * exatamente onde os casos se perdiam.
 *
 * As colunas `Rota`, `Token` e `Status` das tabelas já saem com marcação própria
 * (`td.rota`, `td.tok`, `td.status`), então a extração aqui é estrutural, não
 * adivinhação sobre prosa.
 *
 * Emite dois arrays, `casos` (camada de API) e `casosUnit` (camada unitária).
 * São separados de propósito: `scripts/build-case-map.mjs` itera `casos` sem
 * filtrar por camada e assume `rotas` em todo elemento — um caso unitário ali
 * dentro seria mandado para `caminhoTeste()` e reportado como ausente,
 * contaminando a contagem de P0 e reprovando o portão de API por motivo falso.
 *
 * Uso: node .doc/dashboard/build-strategy-json.mjs [caminho/openapi.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const HTML = resolve(AQUI, 'estrategia-testes-dashboard.html');
const SAIDA = resolve(AQUI, 'estrategia-testes-dashboard.json');
const CONTRATO = process.argv[2] ? resolve(process.argv[2]) : null;

/** Prefixo do ID -> módulo, para o consumidor não precisar reimplementar a tabela. */
const MODULOS = {
  AG: 'Agendamentos', F: 'Formulários', LGPD: 'Privacidade e LGPD', C: 'Clientes',
  H: 'Home', G: 'Grupos', CAT: 'Catálogo', MK: 'Marca e aparência',
  BN: 'Banners', MN: 'Menu e navegação', AN: 'Anonimização', ANL: 'Analytics',
};

const html = readFileSync(HTML, 'utf8');

/** Texto legível de uma célula, preservando as aspas das mensagens literais. */
const texto = (s) =>
  s.replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Mensagens entre aspas ou em <i>: o valor que prova o caso. */
function literais(celulaHtml) {
  const achados = new Set();
  for (const m of celulaHtml.matchAll(/<i>(.*?)<\/i>/gs)) {
    const t = texto(m[1]).replace(/^"|"$/g, '');
    if (t) achados.add(t);
  }
  for (const m of texto(celulaHtml).matchAll(/"([^"]{4,})"/g)) achados.add(m[1]);
  return [...achados];
}

/** Campos citados em <code>: nomes e valores esperados na resposta. */
const campos = (celulaHtml) =>
  [...new Set([...celulaHtml.matchAll(/<code>(.*?)<\/code>/gs)].map((m) => texto(m[1])))];

function rotas(celulaHtml) {
  if (!celulaHtml) return [];
  const ausente = celulaHtml.includes('ausente do contrato');
  const principal = texto(celulaHtml.replace(/<span class="arranjo">.*/s, ''));
  const [metodo, ...resto] = principal.split(' ');
  const lista = [{
    papel: ausente ? 'inexistente' : 'acao',
    metodo,
    caminho: resto.join(' '),
  }];
  const extra = celulaHtml.match(/<span class="arranjo">(.*?)<\/span>/s);
  if (extra && !ausente) {
    for (const bruta of texto(extra[1]).split(' · ')) {
      const [m, ...c] = bruta.trim().split(' ');
      if (m && c.length) lista.push({ papel: 'arranjo', metodo: m, caminho: c.join(' ') });
    }
  }
  return lista;
}

/**
 * O selo de caso não verificável, extraído como campo em vez de virar prosa.
 *
 * O caso é descrito aqui — cenário, rota, asserção — e mesmo assim não é
 * escrevível contra o contrato atual: falta rota, a precondição é inalcançável,
 * ou a massa exigiria data retroativa. É diferente de caso esquecido, e o
 * consumidor precisa saber a diferença.
 *
 * Marcação no HTML, dentro da célula de cenário:
 *
 *   <span class="nao-verificavel" data-issue="123">motivo curto</span>
 *
 * Sai do texto do cenário na extração — senão o motivo apareceria colado no
 * título do caso em toda tabela que consome o JSON.
 */
const RE_NAO_VERIFICAVEL =
  /<span class="nao-verificavel" data-issue="(\d+)">(.*?)<\/span>/s;

function naoVerificavel(htmlCenario) {
  const m = htmlCenario.match(RE_NAO_VERIFICAVEL);
  if (!m) return { cenario: htmlCenario, marca: null };
  return {
    cenario: htmlCenario.replace(RE_NAO_VERIFICAVEL, ''),
    // O link visível fica no HTML, para quem lê a estratégia; o JSON leva só o
    // número, e quem consome monta a URL. Repetir os dois duplicaria a fonte.
    marca: {
      motivo: texto(m[2]).replace(/\s*\(\s*#\d+\s*\)\s*$/, ''),
      issue: Number(m[1]),
    },
  };
}

/*
 * Selo de refatoração pendente na célula do Alvo.
 *
 * Ancorado no texto porque `pill warn` é também o crachá de `P1`, na célula da
 * prioridade — e o selo é lido apenas dentro da célula do Alvo, o que remove a
 * dúvida de vez.
 */
const RE_EXTRAIR = /<span class="pill warn">\s*extrair\s*<\/span>/;

/** `arquivo.ts` ou `arquivo.tsx`, com linha, lista de linhas ou faixa opcional. */
const RE_FONTE = /^([\w.-]+\.(?:ts|tsx|mjs))(?::([\d\s,\u2013-]+))?$/;

/** Um identificador, com ou sem lista de argumentos. */
const RE_FUNCAO = /^([A-Za-z_$][\w$.]*)(?:\(.*\))?$/;

/** `73`, `228, 232, 317` e `45-48` — a faixa é expandida. */
function linhasCitadas(bruto) {
  if (!bruto) return [];
  const numeros = [];
  for (const parte of bruto.split(/\s*,\s*/)) {
    const faixa = parte.match(/^(\d+)\s*[-\u2013]\s*(\d+)$/);
    if (faixa) {
      for (let n = Number(faixa[1]); n <= Number(faixa[2]); n += 1) numeros.push(n);
      continue;
    }
    const um = parte.match(/^\d+$/);
    if (um) numeros.push(Number(parte));
  }
  return numeros;
}

/*
 * Arquivos de front que não são `.tsx`.
 *
 * `console-utils.ts` é a única exceção citada pela estratégia (hoje o arquivo
 * vive em `apps/dashboard/lib/display.ts`). Sem esta lista, `UNIT-C-04` seria
 * classificado como caso de API e o portão avisaria superfície divergente.
 */
const FONTES_DE_FRONT = new Set(['console-utils.ts', 'dashboard-console.ts']);

const ehFront = (arquivo) => arquivo.endsWith('.tsx') || FONTES_DE_FRONT.has(arquivo);

/** Função, código solto e arquivo citado na célula do Alvo, sem o selo. */
function alvoDe(celulaHtml) {
  const semSelo = celulaHtml.replace(RE_EXTRAIR, '');
  const fontes = [];
  const funcoes = [];
  const codigos = [];
  for (const trecho of campos(semSelo)) {
    const fonte = trecho.match(RE_FONTE);
    if (fonte) {
      fontes.push({ arquivo: fonte[1], linhas: linhasCitadas(fonte[2]), bruto: fonte[2] ?? null });
      continue;
    }
    const funcao = trecho.match(RE_FUNCAO);
    // `cursor += (duracao + intervalo)` é código, não função — e mutilá-lo com
    // um `replace` de parênteses produziria "cursor +=".
    if (funcao) funcoes.push(funcao[1]);
    else codigos.push(trecho);
  }
  const front = fontes.some((f) => ehFront(f.arquivo));
  const api = fontes.some((f) => !ehFront(f.arquivo));
  return {
    alvo: texto(semSelo),
    fontes,
    funcoes,
    codigos,
    // `null` quando o Alvo não cita arquivo — é o caso de UNIT-AG-02, -H-03 e
    // -MN-04, e o consumidor não pode depender do campo.
    superficie: front && api ? 'ambas' : front ? 'front' : api ? 'api' : null,
    extrair: RE_EXTRAIR.test(celulaHtml),
  };
}

/*
 * Coluna `Relação`, com herança de prefixo.
 *
 * `API-AG-01, -02, -03` são três IDs, não um ID e duas sobras. E em
 * `API-G-09 · E2E-G-02` o segundo item é ID; em `API-AG-04 · divergência a
 * decidir`, é nota. O que não parseia como ID vira nota — nunca é descartado,
 * senão uma mudança de notação desaparece da rastreabilidade sem ruído.
 */
function relacaoDe(celulaHtml) {
  const bruto = texto(celulaHtml);
  if (!bruto || bruto === '\u2014') return { relacao: [], relacaoNota: null };
  const ids = [];
  const notas = [];
  let prefixo = null;
  for (const parte of bruto.split(/\s*[,\u00b7]\s*/)) {
    const item = parte.trim();
    if (!item) continue;
    const inteiro = item.match(/^((?:API|E2E|UNIT)-[A-Z]+)-(\d+)$/);
    if (inteiro) {
      prefixo = inteiro[1];
      ids.push(item);
      continue;
    }
    const curto = item.match(/^-(\d+)$/);
    if (curto && prefixo) {
      ids.push(`${prefixo}-${curto[1]}`);
      continue;
    }
    notas.push(item);
  }
  return { relacao: ids, relacaoNota: notas.join(' \u00b7 ') || null };
}

/** Um caso unitário: `ID | Alvo | O que prova | Relação | Prio`. */
function casoUnitario(celulas, id) {
  const modulo = id.split('-').slice(1, -1).join('-');
  const prova = celulas[2]?.html ?? '';
  const cenario = naoVerificavel(celulas[1].html);
  return {
    id,
    modulo,
    moduloNome: MODULOS[modulo] ?? null,
    camada: 'UNIT',
    prioridade: texto(celulas[celulas.length - 1].html),
    ...alvoDe(cenario.cenario),
    prova: texto(prova),
    literais: literais(prova),
    campos: campos(prova),
    ...relacaoDe(celulas[3]?.html ?? ''),
    naoVerificavel: cenario.marca,
  };
}

const casosUnit = [];
const casos = [];
for (const linha of html.matchAll(/<tr>(.*?)<\/tr>/gs)) {
  const celulas = [...linha[1].matchAll(/<td([^>]*)>(.*?)<\/td>/gs)]
    .map((m) => ({ classe: (m[1].match(/class="([^"]+)"/) || [, ''])[1], html: m[2] }));
  /*
   * O ID é o texto ANTES da primeira tag da célula.
   *
   * A célula leva `API-H-01` mais um `<span class="auto">` carimbado pelo
   * projeto de automação. Sem descartar o selo, o ID viraria
   * "API-H-01 automatizado" e nada casaria — foi o que aconteceu na primeira
   * tentativa de pôr o estado embaixo do ID.
   *
   * A versão anterior cortava a partir de `<span class="auto">`, o que só
   * funcionava enquanto o selo fosse a única marcação da célula. Um bug no
   * carimbo deixou `<small>…</small></span>` órfão ANTES do selo em 157
   * células, e o corte passou a devolver `API-AG-01 AG-01-F.test.ts`. Cortar na
   * primeira tag é imune a qualquer região gerada que venha depois do ID.
   */
  const id = celulas[0] && texto(celulas[0].html.split('<')[0]);
  if (!id) continue;

  if (/^UNIT-[A-Z]+-\d+$/.test(id)) {
    casosUnit.push(casoUnitario(celulas, id));
    continue;
  }
  if (!/^API-[A-Z]+-/.test(id)) continue;

  const por = (classe) => celulas.find((c) => c.classe === classe);
  const rota = por('rota');
  if (!rota) continue;

  // Depois de ID, Cenário, Rota, Token e Status vêm Pré-condição e Asserção;
  // Doc é opcional e Prio é sempre a última.
  const cauda = celulas.slice(5, -1).map((c) => c.html);
  const [precondicao, assercao, doc] = cauda;

  const cenario = naoVerificavel(celulas[1].html);

  casos.push({
    id,
    modulo: id.split('-')[1],
    moduloNome: MODULOS[id.split('-')[1]] ?? null,
    camada: 'API',
    prioridade: texto(celulas[celulas.length - 1].html),
    cenario: texto(cenario.cenario),
    naoVerificavel: cenario.marca,
    rotas: rotas(rota.html),
    // `null` para rota aberta ou sem audiência aplicável (caso de rota inexistente).
    token: ((t) => (t && t !== 'aberta' && t !== 'n/a' ? t : null))(texto(por('tok').html)),
    status: texto(por('status').html).split('/').map((s) => Number(s.trim())).filter(Boolean),
    precondicao: texto(precondicao ?? ''),
    assercao: texto(assercao ?? ''),
    literais: literais(assercao ?? ''),
    campos: campos(assercao ?? ''),
    doc: doc ? texto(doc).replace(/\s*novo$/, '') || null : null,
    novo: Boolean(doc && /novo/.test(doc)),
  });
}

// Conferência contra o contrato, quando ele é passado: rota citada que não
// existe (ou que passou a existir, nos casos de ausência) invalida o artefato.
let conferencia = null;
if (CONTRATO) {
  const spec = JSON.parse(readFileSync(CONTRATO, 'utf8'));
  const validas = new Set(
    Object.entries(spec.paths).flatMap(([caminho, metodos]) =>
      Object.keys(metodos).map((m) => `${m.toUpperCase()} ${caminho}`)),
  );
  const erros = [];
  for (const caso of casos) {
    for (const r of caso.rotas) {
      const chave = `${r.metodo} ${r.caminho}`;
      const existe = validas.has(chave);
      if (r.papel === 'inexistente' && existe) erros.push(`${caso.id}: ${chave} passou a existir`);
      if (r.papel !== 'inexistente' && !existe) erros.push(`${caso.id}: ${chave} não existe no contrato`);
    }
  }
  if (erros.length) {
    console.error('Divergências com o contrato:');
    for (const e of erros) console.error('  ✗', e);
    process.exit(1);
  }
  const citadas = new Set(casos.flatMap((c) => c.rotas.filter((r) => r.papel !== 'inexistente')).map((r) => `${r.metodo} ${r.caminho}`));
  conferencia = { contrato: validas.size, comCaso: citadas.size, semCaso: validas.size - citadas.size };
}

const porModulo = (lista) =>
  Object.fromEntries(
    Object.keys(MODULOS).map((m) => [m, lista.filter((c) => c.modulo === m).length]).filter(([, n]) => n));

const artefato = {
  gerado: new Date().toISOString().slice(0, 10),
  origem: '.doc/dashboard/estrategia-testes-dashboard.html',
  aviso: 'Artefato de build. Editar o HTML e rodar build-strategy-json.mjs.',
  totais: {
    // `casos` e `p0` seguem contando só a camada de API: são os números que o
    // painel e o mapa de casos já publicam, e mudar o significado deles aqui
    // faria toda contagem histórica passar a comparar coisas diferentes.
    casos: casos.length,
    p0: casos.filter((c) => c.prioridade === 'P0').length,
    porModulo: porModulo(casos),
    unit: {
      casos: casosUnit.length,
      p0: casosUnit.filter((c) => c.prioridade === 'P0').length,
      extrair: casosUnit.filter((c) => c.extrair).length,
      porModulo: porModulo(casosUnit),
    },
  },
  ...(conferencia ? { conferencia } : {}),
  casos,
  casosUnit,
};

writeFileSync(SAIDA, `${JSON.stringify(artefato, null, 2)}\n`);
console.log(`${casos.length} casos de API (${artefato.totais.p0} P0) em ${SAIDA}`);
console.log(
  `${casosUnit.length} casos unitários (${artefato.totais.unit.p0} P0, ` +
    `${artefato.totais.unit.extrair} com selo extrair)`,
);
if (conferencia) console.log(`contrato: ${conferencia.comCaso} de ${conferencia.contrato} endpoints com caso`);
