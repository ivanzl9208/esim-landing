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
    assert.match(html, /Ваше устройство готово к\u00a0eSIM/);
    assert.match(html, /story-transcript/);
    assert.match(html, /role="combobox"/);
    assert.match(html, /Остались вопросы/);
    assert.match(html, /role="tablist"/);
    assert.match(html, /Подключайтесь/);
    assert.match(html, /<footer/);
    assert.match(html, /class="skip-link" href="#main-content"/);
    assert.match(html, /class="skip-link" href="#device-checker"/);
    assert.match(html, /class="hero-stage" aria-labelledby="esim-intro-title"/);
    assert.doesNotMatch(html, /data-story-stop/);
    assert.doesNotMatch(html, /<(?:h[1-6]|p|section|article|li)[^>]*tabindex="0"/);
    assert.match(html, /class="desktop-nav" aria-label="Основная навигация"/);
    assert.match(html, /href="tel:901"/);
    assert.match(html, /href="tel:\+74996514444"/);
    assert.doesNotMatch(html, /role="progressbar"/);
    assert.doesNotMatch(html, /role="tabpanel"[^>]*tabindex=/);
    const introGroups = [...html.matchAll(/class="intro-text-group">([\s\S]*?)<\/div>/g)]
      .map(match => [...match[1].matchAll(/class="intro-text-line">([^<]*)<\/span>/g)].map(line => line[1]));
    assert.deepEqual(introGroups, [
      ['eSIM\u00a0—'],
      ['виртуальная', 'сим-карта:'],
      ['звонки,', 'интернет', 'и\u00a0смс\u00a0—'],
    ]);
    assert.doesNotMatch(html, /id="device-checker"[^>]*inert/);
    assert.doesNotMatch(html, /result-curtain|faq-reveal|data-faq-ready/);
    assert.match(html, /id="device-checker"[\s\S]*class="landing-ending"/);
    assert.doesNotMatch(html, /<video[^>]*src=".*(?:mov|webm)"/);
    assert.match(html, /class="hero-video hero-video-fallback"[^>]*hero-poster\.webp/);
    // Invisible suggestions must not appear as a second, closed list of
    // choices to a screen reader. Every image needs a deliberate alternative.
    assert.match(html, /role="listbox"[^>]*aria-hidden="true"[^>]*inert/);
    assert.match(html, /role="combobox"[^>]*aria-invalid="false"/);
    assert.match(html, /aria-label="Проверить iPhone/);
    for (const image of html.matchAll(/<img\b[^>]*>/g)) assert.match(image[0], /\balt="[^"]*"/);
  } finally { await server.close(); }
});
