'use strict';
// Minimal react-native stub for the Jest (node) test environment.
// Tests that need different behaviour override this via jest.mock().
const AppState = {
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  currentState: 'active',
};

module.exports = { AppState };
