import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, ref } from 'vue';
import { useKeyboardViewport } from '../src/composables/useKeyboardViewport.js';

function mountAnchor(t) {
  const keys = ['window', 'document', 'ResizeObserver', 'IntersectionObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'];
  const originals = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const tasks = new Map();
  let serial = 0, now = 0, panelTop = -100, formOrigin = 0, sectionTop = 0;
  const positioned = [];
  const work = { documentReads: 0, heightReads: 0, styleWrites: 0 };
  const viewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0 });
  const layout = Object.assign(new EventTarget(), { innerHeight: 844, innerWidth: 393, scrollY: 1000, visualViewport: viewport });
  const values = new Map();
  const formTop = () => panelTop + formOrigin + (parseFloat(values.get('--checker-keyboard-top')) || 0);
  const input = { matches: selector => selector.includes('input'), getBoundingClientRect: () => ({ top: formTop() + 600, bottom: formTop() + 660 }) };
  const form = { scrollHeight: 844, clientHeight: 844, scrollTop: 0,
    getBoundingClientRect: () => ({ top: formTop(), height: 844, bottom: formTop() + 844 }),
  };
  const panel = { getBoundingClientRect: () => ({ top: panelTop }) };
  const hint = { offsetHeight: 28 };
  const root = Object.assign(new EventTarget(), { dataset: {},
    getBoundingClientRect: () => ({ top: sectionTop }),
    style: { getPropertyValue: key => values.get(key) ?? '', setProperty: (key, value) => { work.styleWrites++; values.set(key, value); } },
    contains: element => element === input,
    querySelector: selector => ({ '.checker-form-view': form, '.checker-panel': panel, 'input': input, '.checker-eid-hint': hint })[selector],
  });
  Object.defineProperty(root, 'clientHeight', { get: () => { work.heightReads++; return 844; } });
  const observers = [];
  const globals = {
    window: layout, document: { activeElement: null, documentElement: {
      getBoundingClientRect: () => { work.documentReads++; return { top: -layout.scrollY }; },
    } }, performance: { now: () => now },
    requestAnimationFrame: cb => { tasks.set(++serial, cb); return serial; },
    cancelAnimationFrame: id => tasks.delete(id),
    ResizeObserver: class { constructor() { this.targets = new Set(); observers.push(this); } observe(el) { this.targets.add(el); } unobserve(el) { this.targets.delete(el); } disconnect() { this.targets.clear(); } },
    IntersectionObserver: class { observe() {} disconnect() {} },
  };
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode() {}, nextSibling() {} });
  const app = renderer.createApp({ setup() { useKeyboardViewport(ref(root)); return () => null; } });
  app.provide('setScrollPosition', top => {
    positioned.push(top);
    const delta = top - layout.scrollY;
    sectionTop -= delta;
    panelTop -= delta;
    layout.scrollY = top;
  });
  app.mount({});
  const tick = (ms = 16) => { now += ms; const pending = [...tasks.values()]; tasks.clear(); pending.forEach(cb => cb(now)); };
  const focus = () => { document.activeElement = input; root.dispatchEvent(new Event('focusin')); };
  t.after(() => {
    app.unmount();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  });
  return { root, viewport, layout, input, form, observers, values, tasks, tick, focus, app, work, positioned,
    setSectionTop: value => { sectionTop = panelTop = value; },
    setPanelTop: value => { panelTop = value; }, setFormOrigin: value => { formOrigin = value; } };
}

test('Scrolling earlier scenes does no keyboard layout reads or style writes while the input is inactive', t => {
  const anchor = mountAnchor(t);
  for (const key of Object.keys(anchor.work)) anchor.work[key] = 0;
  for (let i = 0; i < 100; i++) {
    anchor.layout.dispatchEvent(new Event('scroll'));
    anchor.viewport.dispatchEvent(new Event('scroll'));
    anchor.tick();
  }
  assert.deepEqual(anchor.work, { documentReads: 0, heightReads: 0, styleWrites: 0 });
  assert.equal(anchor.tasks.size, 0);
});

test('Focusing the partly scrolled-away checker returns the whole page from FAQ once without refocusing', t => {
  const anchor = mountAnchor(t);
  anchor.setSectionTop(-300);
  anchor.focus();
  assert.deepEqual(anchor.positioned, [700]);
  assert.equal(anchor.root.getBoundingClientRect().top, 0);
  assert.equal(document.activeElement, anchor.input);
  anchor.viewport.height = 484;
  anchor.viewport.dispatchEvent(new Event('resize'));
  anchor.tick();
  assert.equal(anchor.form.getBoundingClientRect().bottom, 484);
  for (let i = 0; i < 10; i++) {
    anchor.viewport.dispatchEvent(new Event('scroll'));
    anchor.tick();
  }
  assert.deepEqual(anchor.positioned, [700], 'Keyboard settling never runs a document-scroll loop');
  assert.equal(anchor.form.scrollTop, 0);
});

test('Hardware-keyboard focus and unchanged resize never poll document geometry or rewrite the same scale', t => {
  const anchor = mountAnchor(t);
  for (const key of Object.keys(anchor.work)) anchor.work[key] = 0;
  anchor.focus();
  for (let i = 0; i < 60; i++) anchor.tick();
  assert.deepEqual(anchor.work, { documentReads: 0, heightReads: 0, styleWrites: 0 });
  anchor.layout.dispatchEvent(new Event('resize'));
  anchor.tick();
  assert.equal(anchor.work.heightReads, 1, 'Actual resizes still remeasure form size');
  assert.equal(anchor.work.documentReads, 0);
  assert.equal(anchor.work.styleWrites, 0);
});

test('Late Safari document pan keeps orange coverage above the keyboard without another page-scroll correction', t => {
  const anchor = mountAnchor(t);
  anchor.setSectionTop(-300);
  anchor.focus();
  anchor.viewport.height = 484;
  anchor.viewport.offsetTop = 280;
  anchor.tick();
  anchor.layout.scrollY += 252;
  anchor.setSectionTop(-252);
  anchor.viewport.dispatchEvent(new Event('scroll'));
  anchor.tick();
  const coverage = parseFloat(anchor.values.get('--checker-keyboard-cover-height'));
  assert.equal(anchor.root.getBoundingClientRect().top + coverage, 764);
  assert.equal(anchor.form.getBoundingClientRect().bottom, 764);
  assert.equal(anchor.values.get('--checker-keyboard-layout-height'), '844.00px');
  assert.deepEqual(anchor.positioned, [700], 'Native caret pan is not fought with a document-scroll loop');
});

test('The keyboard lifts the unchanged composition, bottom-aligned to Safari’s panned visible viewport', t => {
  const anchor = mountAnchor(t);
  anchor.focus();
  anchor.viewport.height = 484;
  anchor.viewport.offsetTop = 280;
  anchor.layout.innerHeight = 484;
  anchor.viewport.dispatchEvent(new Event('resize'));
  assert.equal(anchor.tasks.size, 1, 'Focus/resize are coalesced into one display tick');
  anchor.tick();
  assert.equal(anchor.root.dataset.keyboardOpen, 'true');
  assert.equal(anchor.values.get('--checker-keyboard-top'), '20.00px');
  assert.equal(anchor.values.get('--checker-keyboard-layout-height'), '844.00px');
  assert.equal(anchor.values.get('--checker-keyboard-height'), '484.00px');
  assert.equal(anchor.values.get('--checker-suggestions-space'), '232.00px');
  assert.equal(anchor.form.getBoundingClientRect().bottom, 764);
  assert.ok(anchor.observers[0].targets.has(anchor.form));
  // The panel continues its entrance after Safari's final viewport event.
  anchor.setPanelTop(-120);
  anchor.tick();
  assert.equal(anchor.values.get('--checker-keyboard-top'), '40.00px');
  for (let i = 0; i < 60; i++) anchor.tick();
  assert.equal(anchor.tasks.size, 0, 'The temporary settling loop stops without a permanent rAF');
  anchor.viewport.offsetTop = 300;
  anchor.viewport.dispatchEvent(new Event('scroll'));
  anchor.tick();
  assert.equal(anchor.root.dataset.keyboardOpen, 'true');
  assert.equal(anchor.values.get('--checker-keyboard-top'), '60.00px');
  anchor.app.unmount();
  assert.equal(anchor.tasks.size, 0, 'Unmount cancels pending keyboard frames');
});

test('Focused content moving independently of its panel is corrected without accumulating offsets', t => {
  const anchor = mountAnchor(t);
  anchor.focus();
  anchor.viewport.height = 484;
  anchor.viewport.offsetTop = 280;
  anchor.setFormOrigin(300);
  anchor.tick();
  assert.equal(anchor.form.getBoundingClientRect().bottom, 764, 'The entire form bottom follows the visible bottom');
  assert.equal(anchor.values.get('--checker-keyboard-top'), '-280.00px');
  for (let i = 0; i < 10; i++) anchor.tick();
  assert.equal(anchor.values.get('--checker-keyboard-top'), '-280.00px', 'Repeated frames do not add Safari’s pan again');
  anchor.setFormOrigin(140);
  anchor.viewport.dispatchEvent(new Event('scroll'));
  anchor.tick();
  assert.equal(anchor.form.getBoundingClientRect().bottom, 764);
});

test('Compact keyboard view lifts content rather than compressing or internally scrolling the form', t => {
  const anchor = mountAnchor(t);
  anchor.focus();
  anchor.viewport.height = 320;
  anchor.viewport.offsetTop = 180;
  anchor.viewport.dispatchEvent(new Event('resize'));
  anchor.tick();
  assert.equal(anchor.form.scrollTop, 0);
  assert.equal(anchor.form.getBoundingClientRect().height, 844);
  assert.equal(anchor.form.getBoundingClientRect().bottom, 500);
  assert.ok(anchor.input.getBoundingClientRect().top >= 180);
  assert.ok(anchor.input.getBoundingClientRect().bottom <= 500);
  assert.equal(document.activeElement, anchor.input);
});

test('Blur and keyboard dismissal restore the original layout without scrolling or refocusing the page', t => {
  const anchor = mountAnchor(t);
  anchor.focus();
  anchor.viewport.height = 484;
  anchor.viewport.dispatchEvent(new Event('resize'));
  anchor.tick();
  assert.equal(anchor.root.dataset.keyboardOpen, 'true');
  document.activeElement = null;
  anchor.root.dispatchEvent(new Event('focusout'));
  anchor.viewport.height = 844;
  anchor.viewport.dispatchEvent(new Event('resize'));
  anchor.tick();
  assert.equal(anchor.root.dataset.keyboardOpen, 'false');
  assert.equal(anchor.values.get('--checker-keyboard-top'), '0.00px');
  assert.equal(anchor.values.get('--checker-keyboard-height'), '0.00px');
  assert.equal(document.activeElement, null);
  assert.equal(anchor.tasks.size, 0);
});
