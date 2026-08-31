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
  jobs: process.env.CI === 'true' ? 4 : 10,
  bail: false,
  grep: process.env.GREP || undefined,
  forbidOnly: process.env.CI === 'true',
  color: true,
  diff: true,
  exit: true,
};
