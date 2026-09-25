import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVICE_DATABASE, POPULAR_DEVICE_NAMES } from '../src/data/deviceDatabase.js';
import { findNearestDevice, getFullName, getSuggestions, findPopularDevice, normalizeSearch, isBrandOnly } from '../src/utils/deviceSearch.js';

const aliases = [
  ['Айфон 16 про макс', 'Apple iPhone 16 Pro Max'],
  ['Самсунг с23 ультра', 'Samsung Galaxy S23 Ultra'],
  ['Эпл вотч ультра 2', 'Apple Watch Ultra 2'],
  ['Гугл пиксель 10 про', 'Google Pixel 10 Pro'],
  ['айфн 17 про макс', 'Apple iPhone 17 Pro Max'],
  ['самсунг галакси с23+', 'Samsung Galaxy S23+'],
];
for (const [query, expected] of aliases) test(`Recognizes ${query}`, () => {
  assert.equal(getFullName(findNearestDevice(query)), expected);
  assert.equal(getFullName(getSuggestions(query)[0]), expected);
});
test('Distinguishes unsupported devices from unknown models', () => {
  assert.equal(findNearestDevice('iPhone 8 Plus').supportsEsim, false);
  assert.equal(findNearestDevice('Huawei MatePad Pro 13.2').supportsEsim, false);
  for (const query of ['', 'Samsung', 'iPhone 99', 'abracadabra']) assert.equal(findNearestDevice(query), null);
});
test('Preserves reference database, popular choices and suggestion limit', () => {
  assert.equal(DEVICE_DATABASE.length, 28);
  assert.equal(POPULAR_DEVICE_NAMES.length, 10);
  assert.ok(POPULAR_DEVICE_NAMES.every(label => findPopularDevice(label)));
  assert.equal(getSuggestions('Samsung').length, 5);
  assert.equal(normalizeSearch('  САМСУНГ С23+  '), 'samsung s23 plus');
});
test('Preserves approximate variant matching for reference parity', () => {
  assert.equal(getFullName(findNearestDevice('iPhone 16')), 'Apple iPhone 16 Pro');
  assert.equal(getFullName(findNearestDevice('Samsung Galaxy S23 FE')), 'Samsung Galaxy S23');
});
test('Recognizes manufacturer-only queries in Latin, Cyrillic and existing aliases', () => {
  for (const query of ['Samsung', ' Самсунг ', 'САМСУНГ', 'Apple', 'эпл', 'айфон', 'Google', 'гугл', 'Xiaomi', 'сяоми', 'Huawei', 'хуавей']) {
    assert.equal(isBrandOnly(query), true, query);
    assert.equal(findNearestDevice(query), null, query);
  }
  for (const query of ['Samsung Galaxy S23', 'Самсунг с23', 'iPhone 8 Plus', 'абракадабра', 'iPhone 99', '']) {
    assert.equal(isBrandOnly(query), false, query);
  }
});
