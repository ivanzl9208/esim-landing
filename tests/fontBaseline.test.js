import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const css = await readFile(new URL('src/styles/reference.css', root), 'utf8');
const header = await readFile(new URL('src/components/SiteHeader.vue', root), 'utf8');
const html = await readFile(new URL('index.html', root), 'utf8');
const rule = (source, selector) => source.slice(source.indexOf(`${selector} {`)).split('}')[0];

test('Original OTF faces are used without the legacy-laptop hinted font substitution or preload', async () => {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(match => match[1]);
  assert.equal(faces.length, 4);
  for (const [index, file] of [
    'SBSansDisplay-Regular.otf', 'SBSansDisplay-SemiBold.otf',
    'SBSansText-Regular.otf', 'SBSansText-Semibold.otf',
  ].entries()) {
    assert.ok(faces[index].includes(`url("/assets/${file}") format("opentype")`));
    assert.equal([...faces[index].matchAll(/url\(/g)].length, 1);
    await access(new URL(`public/assets/${file}`, root));
  }
  assert.doesNotMatch(html, /rel="preload"[^>]+as="font"/);
  assert.match(rule(css, ':root'), /text-rendering: geometricPrecision/);
  assert.doesNotMatch(rule(css, ':root'), /font-kerning: normal|optimizeLegibility/);
});

test('Header and body copy regain SB Sans Text, while display headings retain their original family', () => {
  for (const selector of ['.location', '.desktop-nav > a', '.header-bonus', '.header-login']) {
    assert.match(rule(header, selector), /"SB Sans Text"/);
  }
  for (const selector of ['.chip-feature', '.checker-popular button', '.checker-result-copy p']) {
    assert.match(rule(css, selector), /font-family: "SB Sans Text"/);
  }
  assert.doesNotMatch(rule(css, '.checker-popular'), /font-family:/);
  assert.match(rule(css, '.chip-feature h2'), /font-family: "SB Sans Display"/);
  assert.match(css, /\.soft-blur-unit\s*\{[^}]*overflow: visible;[^}]*padding-block: 0\.18em;[^}]*margin-block: -0\.18em;/);
});
