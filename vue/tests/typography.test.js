import test from 'node:test';
import assert from 'node:assert/strict';
import { typograph, typographModelName } from '../src/utils/typography.js';
const n = '\u00a0';
test('Model generation numbers wrap with the previous word, including before a suffix', () => {
  assert.equal(typographModelName('Samsung Galaxy Watch 8'), `Samsung Galaxy Watch${n}8`);
  assert.equal(typographModelName('Apple iPhone 16 Pro Max'), `Apple iPhone${n}16 Pro Max`);
  assert.equal(typographModelName('Samsung Galaxy Z Flip 7'), `Samsung Galaxy Z Flip${n}7`);
  assert.equal(typographModelName('Samsung Galaxy S25 Ultra'), 'Samsung Galaxy S25 Ultra');
  assert.equal(typographModelName('Apple iPhone X'), 'Apple iPhone X');
  assert.equal(typographModelName(`Watch${n}8`), `Watch${n}8`);
  assert.equal(typographModelName('Watch\n8'), 'Watch\n8');
  assert.equal(typographModelName(null), null);
});
test('Display typography protects short Russian links and number/unit pairs', () => {
  assert.equal(typograph('В смартфоне и в планшете за 5 минут — 30 % и 2 ГБ'), `В${n}смартфоне и${n}в${n}планшете за${n}5${n}минут${n}— 30${n}% и${n}2${n}ГБ`);
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
test('Particles stay with the previous word, while dashes, dates and numbers stay with their anchors', () => {
  assert.equal(typograph('Можно ли перенести номер?'), `Можно${n}ли перенести номер?`);
  assert.equal(typograph('Это устройство — eSIM'), `Это устройство${n}— eSIM`);
  assert.equal(typograph('До 12 апреля, № 123'), `До${n}12${n}апреля, №${n}123`);
  assert.equal(typograph('Как узнать, есть ли eSIM?'), `Как${n}узнать, есть${n}ли eSIM?`);
});
