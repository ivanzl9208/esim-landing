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
test('Preserves popular choices and specific-query limit without duplicate devices', () => {
  assert.equal(new Set(DEVICE_DATABASE.map(getFullName)).size, DEVICE_DATABASE.length);
  assert.equal(POPULAR_DEVICE_NAMES.length, 10);
  assert.ok(POPULAR_DEVICE_NAMES.every(label => findPopularDevice(label)));
  assert.ok(getSuggestions('Samsung Galaxy S').length <= 5);
  assert.equal(normalizeSearch('  САМСУНГ С23+  '), 'samsung s23 plus');
});
test('Apple brand queries expose the full Apple catalogue through Cyrillic aliases', () => {
  const appleDevices = DEVICE_DATABASE.filter(device => device.brand === 'Apple');
  const expected = getSuggestions('Apple').map(getFullName);
  assert.equal(expected.length, appleDevices.length);
  assert.ok(expected.length > 5);
  assert.ok(appleDevices.every(device => expected.includes(getFullName(device))));
  for (const query of ['Эпл', 'Эппл', ' Аппл ']) {
    assert.deepEqual(getSuggestions(query).map(getFullName), expected);
  }
});
test('iPhone and Samsung catalogue queries expose all matching devices in both languages', () => {
  for (const [query, aliases, matches] of [
    ['iPhone', ['Айфон', 'IPHONE', 'айфоун'], device => device.brand === 'Apple' && device.model.startsWith('iPhone')],
    ['Samsung', ['Самсунг', 'САМСУНГ', 'samsung'], device => device.brand === 'Samsung'],
  ]) {
    const expected = getSuggestions(query).map(getFullName);
    const catalogue = DEVICE_DATABASE.filter(matches);
    assert.ok(expected.length > 5);
    assert.equal(expected.length, catalogue.length);
    assert.ok(catalogue.every(device => expected.includes(getFullName(device))));
    for (const alias of aliases) assert.deepEqual(getSuggestions(alias).map(getFullName), expected);
    assert.equal(findNearestDevice(query), null);
  }
});
test('Expanded catalogue resolves every official model exactly', () => {
  for (const device of DEVICE_DATABASE) {
    const name = getFullName(device);
    assert.equal(getFullName(findNearestDevice(name)), name);
    assert.equal(getFullName(getSuggestions(name)[0]), name);
  }
});
test('iPhone catalogue keeps generations and their variants together', () => {
  const models = getSuggestions('Айфон').map(device => device.model);
  assert.deepEqual(models, [
    'iPhone 8 Plus', 'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
    'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
    'iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 16e',
    'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone Air',
  ]);
  assert.deepEqual(getSuggestions('Apple').filter(device => device.model.startsWith('iPhone')).map(device => device.model), models);
});
test('Samsung catalogue groups ascending generations and puts separate series after Galaxy S', () => {
  assert.deepEqual(getSuggestions('Самсунг').map(device => device.model), [
    'Galaxy S20', 'Galaxy S20+', 'Galaxy S20 Ultra', 'Galaxy S20 FE',
    'Galaxy S21', 'Galaxy S21+', 'Galaxy S21 Ultra',
    'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra 5G',
    'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S23 FE',
    'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra', 'Galaxy S24 FE',
    'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra', 'Galaxy S25 Edge', 'Galaxy S25 FE',
    'Galaxy S26', 'Galaxy S26+', 'Galaxy S26 Ultra',
    'Galaxy A54',
    'Galaxy Z Fold 3', 'Galaxy Z Fold 4', 'Galaxy Z Fold 5', 'Galaxy Z Fold 6', 'Galaxy Z Fold 7',
    'Galaxy Z Flip 3', 'Galaxy Z Flip 4', 'Galaxy Z Flip 5', 'Galaxy Z Flip 6', 'Galaxy Z Flip 7',
    'Galaxy Watch 8',
  ]);
});
test('Base models and named variants resolve separately through Cyrillic aliases', () => {
  for (const [query, expected] of [
    ['Айфон 16', 'Apple iPhone 16'],
    ['Айфон 16 плюс', 'Apple iPhone 16 Plus'],
    ['Айфон 16 про', 'Apple iPhone 16 Pro'],
    ['Айфон 16 про макс', 'Apple iPhone 16 Pro Max'],
    ['Айфон 15', 'Apple iPhone 15'],
    ['Самсунг с24', 'Samsung Galaxy S24'],
    ['Самсунг с24 плюс', 'Samsung Galaxy S24+'],
    ['Самсунг с24 ультра', 'Samsung Galaxy S24 Ultra'],
    ['Samsung Galaxy S23 FE', 'Samsung Galaxy S23 FE'],
    ['Samsung Galaxy S20 FE', 'Samsung Galaxy S20 FE'],
  ]) {
    assert.equal(getFullName(findNearestDevice(query)), expected);
    assert.equal(getFullName(getSuggestions(query)[0]), expected);
  }
  assert.equal(findNearestDevice('Samsung Galaxy S23 FE').supportsEsim, true);
  assert.equal(findNearestDevice('Samsung Galaxy S20 FE').supportsEsim, false);
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
