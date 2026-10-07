import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, nextTick, ref } from 'vue';
import { useDeviceChecker, CHECK_DELAY } from '../src/composables/useDeviceChecker.js';
import { getSuggestions } from '../src/utils/deviceSearch.js';

// Mount the real composable with Vue's lifecycle. The input's focus event uses
// the same focused-state assignment as DeviceChecker.vue; no viewport is faked.
function mountChecker(t) {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = new EventTarget();
  globalThis.document = { activeElement: null };
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let checker;
  const field = {
    focus() { document.activeElement = field; checker.focused.value = true; },
    blur() { document.activeElement = null; checker.blurInput(); },
  };
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {},
  });
  const app = renderer.createApp({
    setup() { checker = useDeviceChecker(ref(field), ref(null)); return () => null; },
  });
  app.mount({});
  t.after(() => {
    app.unmount();
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  });
  return { checker, field };
}
const flush = async () => { await nextTick(); await nextTick(); };

test('Brand validation retains actual focus and query while suppressing suggestions; editing resumes autocomplete', async t => {
  const { checker, field } = mountChecker(t);
  checker.changeQuery('Самсунг');
  field.focus();
  assert.equal(checker.expanded.value, true);
  for (let cycle = 0; cycle < 3; cycle++) {
    await checker.runCheck();
    assert.equal(checker.state.value, 'loading');
    t.mock.timers.tick(CHECK_DELAY);
    await flush();
    assert.equal(checker.state.value, 'form');
    assert.equal(document.activeElement, field);
    assert.equal(checker.focused.value, true);
    assert.equal(checker.query.value, 'Самсунг');
    assert.equal(checker.invalidQuery.value, true);
    assert.equal(checker.expanded.value, false);
    assert.equal(checker.toastMessage.value, 'Введите модель устройства');
  }
  checker.changeQuery('Самсунг с23 ультра');
  assert.equal(checker.invalidQuery.value, false);
  assert.equal(checker.expanded.value, true);
  assert.equal(checker.toastVisible.value, false);
});

test('Unknown-model validation, clear, selection, result and reset preserve focus behavior', async t => {
  const { checker, field } = mountChecker(t);
  checker.changeQuery('неизвестная модель 987654');
  field.focus();
  await checker.runCheck();
  t.mock.timers.tick(CHECK_DELAY);
  await flush();
  assert.equal(checker.focused.value, true);
  assert.equal(checker.expanded.value, false);
  assert.equal(checker.toastMessage.value, 'Устройство не найдено, измените модель');
  await checker.clearQuery();
  assert.equal(checker.query.value, '');
  assert.equal(checker.invalidQuery.value, false);
  assert.equal(document.activeElement, field);
  for (const [query, supported] of [['Самсунг с23 ультра', true], ['Айфон 8 плюс', false]]) {
    checker.changeQuery(query);
    const device = getSuggestions(query)[0];
    assert.equal(device.supportsEsim, supported);
    checker.choose(device);
    await flush();
    assert.equal(checker.focused.value, false);
    assert.notEqual(document.activeElement, field);
    t.mock.timers.tick(CHECK_DELAY);
    await flush();
    assert.equal(checker.state.value, 'result');
    assert.equal(checker.selection.value.supportsEsim, supported);
    await checker.reset();
    assert.equal(checker.state.value, 'form');
    assert.equal(checker.query.value, '');
    assert.equal(checker.focused.value, true);
    assert.equal(checker.expanded.value, false);
  }
});
