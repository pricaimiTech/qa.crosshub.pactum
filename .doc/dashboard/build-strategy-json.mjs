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
 * Uso: node docs/test-strategy/02/build-strategy-json.mjs [caminho/openapi.json]
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
  BN: 'Banners', MN: 'Menu e navegação', AN: 'Anonimização',
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

const casos = [];
for (const linha of html.matchAll(/<tr>(.*?)<\/tr>/gs)) {
  const celulas = [...linha[1].matchAll(/<td([^>]*)>(.*?)<\/td>/gs)]
    .map((m) => ({ classe: (m[1].match(/class="([^"]+)"/) || [, ''])[1], html: m[2] }));
  const id = celulas[0] && texto(celulas[0].html);
  if (!id || !/^API-[A-Z]+-/.test(id)) continue;

  const por = (classe) => celulas.find((c) => c.classe === classe);
  const rota = por('rota');
  if (!rota) continue;

  // Depois de ID, Cenário, Rota, Token e Status vêm Pré-condição e Asserção;
  // Doc é opcional e Prio é sempre a última.
  const cauda = celulas.slice(5, -1).map((c) => c.html);
  const [precondicao, assercao, doc] = cauda;

  casos.push({
    id,
    modulo: id.split('-')[1],
    moduloNome: MODULOS[id.split('-')[1]] ?? null,
    camada: 'API',
    prioridade: texto(celulas[celulas.length - 1].html),
    cenario: texto(celulas[1].html),
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

const artefato = {
  gerado: new Date().toISOString().slice(0, 10),
  origem: 'docs/test-strategy/02/estrategia-testes-dashboard.html',
  aviso: 'Artefato de build. Editar o HTML e rodar build-strategy-json.mjs.',
  totais: {
    casos: casos.length,
    p0: casos.filter((c) => c.prioridade === 'P0').length,
    porModulo: Object.fromEntries(
      Object.keys(MODULOS).map((m) => [m, casos.filter((c) => c.modulo === m).length]).filter(([, n]) => n)),
  },
  ...(conferencia ? { conferencia } : {}),
  casos,
};

writeFileSync(SAIDA, `${JSON.stringify(artefato, null, 2)}\n`);
console.log(`${casos.length} casos (${artefato.totais.p0} P0) em ${SAIDA}`);
if (conferencia) console.log(`contrato: ${conferencia.comCaso} de ${conferencia.contrato} endpoints com caso`);
