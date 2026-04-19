/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '..',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'assets/js/**/*.js',
    '!assets/js/gps.js'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { branches: 50, functions: 60, lines: 60, statements: 60 }
  },
  verbose: true
};
