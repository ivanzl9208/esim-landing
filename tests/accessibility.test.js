import test from 'node:test';
import assert from 'node:assert/strict';
import { setRegionInteractive } from '../src/utils/interactiveRegion.js';

function element(initial = {}) {
  const attributes = new Map(Object.entries(initial));
  return {
    getAttribute: name => attributes.has(name) ? attributes.get(name) : null,
    setAttribute: (name, value) => attributes.set(name, String(value)),
    removeAttribute: name => attributes.delete(name),
  };
}

test('hidden scroll regions leave the keyboard and accessibility order, including without native inert', () => {
  const plain = element();
  const explicit = element({ tabindex: '0' });
  const rootAttributes = new Map();
  const root = {
    inert: false,
    setAttribute: (name, value) => rootAttributes.set(name, String(value)),
    removeAttribute: name => rootAttributes.delete(name),
    querySelectorAll: () => [plain, explicit],
  };

  setRegionInteractive(root, false);
  assert.equal(root.inert, true);
  assert.equal(rootAttributes.get('aria-hidden'), 'true');
  assert.equal(plain.getAttribute('tabindex'), '-1');
  assert.equal(explicit.getAttribute('tabindex'), '-1');

  // Repeated scroll renders must not overwrite the original tab order.
  setRegionInteractive(root, false);
  setRegionInteractive(root, true);
  assert.equal(root.inert, false);
  assert.equal(rootAttributes.has('aria-hidden'), false);
  assert.equal(plain.getAttribute('tabindex'), null);
  assert.equal(explicit.getAttribute('tabindex'), '0');
});

test('animation mocks without a complete Element API still receive inert state', () => {
  const root = { inert: false };
  assert.doesNotThrow(() => setRegionInteractive(root, false));
  assert.equal(root.inert, true);
});
