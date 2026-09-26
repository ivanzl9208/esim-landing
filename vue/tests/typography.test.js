import test from 'node:test';
import assert from 'node:assert/strict';
import { typograph } from '../src/utils/typography.js';
const n = '\u00a0';
test('Display typography protects short Russian links and number/unit pairs', () => {
  assert.equal(typograph('В смартфоне и в планшете за 5 минут — 30 % и 2 ГБ'), `В${n}смартфоне и${n}в${n}планшете за${n}5${n}минут — 30${n}% и${n}2${n}ГБ`);
  assert.equal(typograph('А. С. Пушкин'), `А.${n}С.${n}Пушкин`);
});
test('Existing design spacing/newlines, attributes and opt-out remain intact', () => {
  const composed = `Несколько номеров\nв${n}одном устройстве`;
  assert.equal(typograph(composed), composed);
  assert.equal(typograph('в смартфоне', { enabled: false }), 'в смартфоне');
  assert.equal(typograph('https://sbermobile.ru/tariffs/'), 'https://sbermobile.ru/tariffs/');
  assert.equal(typograph(null), null);
});
test('Formatting is idempotent and does not glue arbitrary long chains', () => {
  const text = 'и в смартфоне с производителемнеизвестноготипа';
  assert.equal(typograph(typograph(text)), typograph(text));
  assert.equal(typograph('с производителемнеизвестноготипа'), 'с производителемнеизвестноготипа');
});
