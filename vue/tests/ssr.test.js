import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

test('Imports and server-renders the complete app without browser globals', async () => {
  assert.equal(typeof window, 'undefined');
  assert.equal(typeof document, 'undefined');
  const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.vue');
    const html = await renderToString(createSSRApp(App));
    assert.match(html, /Ваше устройство готово к eSIM/);
    assert.match(html, /story-transcript/);
    assert.match(html, /role="combobox"/);
    assert.match(html, /Остались вопросы/);
    assert.match(html, /role="tablist"/);
    assert.match(html, /Подключайтесь/);
    assert.match(html, /<footer/);
    assert.doesNotMatch(html, /id="device-checker"[^>]*inert/);
    assert.doesNotMatch(html, /result-curtain|faq-reveal|data-faq-ready/);
    assert.match(html, /id="device-checker"[\s\S]*class="landing-ending"/);
    assert.doesNotMatch(html, /<video[^>]*src=".*(?:mov|webm)"/);
  } finally { await server.close(); }
});
