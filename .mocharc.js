/*
 * Paralelismo por ambiente (#133).
 *
 * O login público do cliente final tem limite de tentativas. Até a correção
 * do #133 a chave era `login:<ip>:<slug>`, um balde só para o tenant inteiro,
 * e com 10 workers a suíte derrubava a si mesma em `develop`: bastavam cinco
 * falhas — um pool de clientes desatualizado, por exemplo — para as ondas
 * seguintes tomarem 429 no `before`. Com a chave por conta isso não acontece
 * mais, mas o teto por IP (30 falhas/min) continua valendo para o runner
 * inteiro, então em ambiente compartilhado vale rodar mais devagar.
 *
 * `JOBS` sobrepõe, para quem quiser medir. Voltar `develop` a 10 é seguro
 * assim que a correção do #133 estiver publicada lá — e o sinal de que deu
 * certo é a suíte passar sem 429 nenhum.
 */
function jobsPadrao() {
  if (process.env.CI === 'true') return 4
  return process.env.TEST_ENV === 'develop' ? 2 : 10
}

module.exports = {
  require: ['tsconfig-paths/register'],
  'node-option': [
    `max-old-space-size=${process.env.CI === 'true' ? 2048 : 4096}`,
  ], // Aumenta o limite de memória para evitar deadlock
  reporter: 'mocha-multi-reporters',
  reporterOptions: {
    reporters: [
      { reporter: 'spec' },
      {
        reporter: 'mocha-junit-reporter',
        reporterOptions: {
          mochaFile: './xunit.xml',
        },
      },
    ],
  },
  slow: '2000',
  timeout: 900000,
  parallel: true,
  jobs: Number(process.env.JOBS) || jobsPadrao(),
  bail: false,
  grep: process.env.GREP || undefined,
  forbidOnly: process.env.CI === 'true',
  color: true,
  diff: true,
  exit: true,
};
