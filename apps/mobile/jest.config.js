const path = require('path');

// react-native is not hoisted to the root node_modules in this pnpm workspace
// (it is bundled exclusively via Expo's Metro resolver).  We therefore skip
// jest-expo's preset and configure babel-jest directly, and we omit
// @testing-library/jest-native's extend-expect because its component matchers
// (toBeVisible, toHaveText, …) also import react-native — none of our unit
// tests render React Native components, so plain Jest matchers suffice.
const babelJest = require.resolve('babel-jest');

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__jest__/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': path.resolve(__dirname, 'src/$1'),
    // react-native is not hoisted to root node_modules; point to a minimal stub
    // so jest.mock('react-native', ...) factories can override it per test.
    '^react-native$': path.resolve(__dirname, '__mocks__/react-native-mock.js'),
    '\\.(jpg|jpeg|png|gif|svg|ttf|woff|woff2)$': path.resolve(__dirname, '__mocks__/fileMock.js'),
  },
  transform: {
    '^.+\\.[jt]sx?$': [babelJest, { configFile: path.resolve(__dirname, 'babel.config.js') }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|nativewind|react-native-css-interop|tailwindcss)',
  ],
};
