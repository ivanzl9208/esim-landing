import { DEVICE_DATABASE } from '../data/deviceDatabase.js';

const BRAND_ALIASES = {
  apple: ["apple", "iphone", "ipad"],
  samsung: ["samsung", "galaxy"],
  xiaomi: ["xiaomi"],
  google: ["google", "pixel"],
  huawei: ["huawei", "matepad"],
};

const SEARCH_TOKEN_ALIASES = new Map([
  ["эппл", "apple"],
  ["эпл", "apple"],
  ["аппл", "apple"],
  ["айфон", "iphone"],
  ["айфоун", "iphone"],
  ["айпад", "ipad"],
  ["айпэд", "ipad"],
  ["вотч", "watch"],
  ["воч", "watch"],
  ["уотч", "watch"],
  ["самсунг", "samsung"],
  ["галакси", "galaxy"],
  ["гелекси", "galaxy"],
  ["гэлакси", "galaxy"],
  ["гугл", "google"],
  ["пиксель", "pixel"],
  ["пиксел", "pixel"],
  ["сяоми", "xiaomi"],
  ["ксиаоми", "xiaomi"],
  ["шаоми", "xiaomi"],
  ["хуавей", "huawei"],
  ["хуавэй", "huawei"],
  ["мейтпад", "matepad"],
  ["мэйтпад", "matepad"],
  ["про", "pro"],
  ["макс", "max"],
  ["ультра", "ultra"],
  ["плюс", "plus"],
  ["мини", "mini"],
  ["восемь", "8"],
  ["фолд", "fold"],
  ["флип", "flip"],
  ["серия", "series"],
  ["серии", "series"],
  ["эйр", "air"],
  ["аир", "air"],
  ["икс", "x"],
]);

const CYRILLIC_MODEL_PREFIXES = new Map([
  ["а", "a"],
  ["м", "m"],
  ["с", "s"],
  ["з", "z"],
]);

const levenshtein = (left, right) => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitution,
      );
    }
    for (let index = 0; index <= right.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
};

const resolveSearchToken = (token) => {
  const exactAlias = SEARCH_TOKEN_ALIASES.get(token);
  if (exactAlias) return exactAlias;

  const modelCode = token.match(/^([амсз])(\d+[a-zа-я]*)$/u);
  if (modelCode) {
    return `${CYRILLIC_MODEL_PREFIXES.get(modelCode[1])}${modelCode[2]}`;
  }

  if (!/[а-я]/u.test(token) || token.length < 4) return token;

  const fuzzyAlias = Array.from(SEARCH_TOKEN_ALIASES.entries())
    .filter(([alias]) => /[а-я]/u.test(alias))
    .map(([alias, replacement]) => ({
      replacement,
      distance: levenshtein(token, alias),
    }))
    .sort((left, right) => left.distance - right.distance)[0];

  const maxDistance = token.length >= 7 ? 2 : 1;
  return fuzzyAlias?.distance <= maxDistance
    ? fuzzyAlias.replacement
    : token;
};

const normalizeSearch = (value) => {
  const normalized = value
    .normalize("NFKC")
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/gu, "е")
    .replace(/\+/gu, " плюс ")
    .replace(/[^a-zа-я0-9]+/giu, " ")
    .trim();

  return normalized
    .split(/\s+/gu)
    .filter(Boolean)
    .map(resolveSearchToken)
    .join(" ");
};

const getFullName = (device) => {
  const model = device.model.trim();
  return normalizeSearch(model).startsWith(normalizeSearch(device.brand))
    ? model
    : `${device.brand} ${model}`;
};

const getPopularName = (device) => {
  if (device.brand === "Apple" && !/^Watch/u.test(device.model)) {
    return device.model;
  }
  return getFullName(device);
};

const getRecognizedBrand = (value) => {
  const normalized = normalizeSearch(value);
  return Object.entries(BRAND_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeSearch(alias);
      return (
        normalized.split(" ").includes(normalizedAlias) ||
        (!normalized.includes(" ") && normalizedAlias.startsWith(normalized))
      );
    }),
  )?.[0] ?? null;
};

const isBrandOnly = (value) => {
  const normalized = normalizeSearch(value);
  return Object.values(BRAND_ALIASES).some((aliases) =>
    aliases.some((alias) => normalized === normalizeSearch(alias)),
  );
};

const rankDevice = (device, value) => {
  const query = normalizeSearch(value);
  const fullName = normalizeSearch(getFullName(device));
  const model = normalizeSearch(device.model);
  const queryTokens = query.split(" ").filter(Boolean);
  const targetTokens = fullName.split(" ");
  const queryNumbers = query.match(/\d+/gu) ?? [];
  const targetNumbers = fullName.match(/\d+/gu) ?? [];

  if (queryNumbers.length && !queryNumbers.every((number) => targetNumbers.includes(number))) {
    return Number.POSITIVE_INFINITY;
  }

  // Fuzzy scores can be negative after the token-coverage bonus. Reserve
  // a lower score for exact names so a neighbouring variant cannot win.
  if (fullName === query || model === query) return -1;
  if (fullName.includes(query) || model.includes(query)) {
    return 0.04 + Math.abs(fullName.length - query.length) / 500;
  }

  const tokenMatches = queryTokens.filter((token) =>
    targetTokens.some((target) => target.startsWith(token) || token.startsWith(target)),
  ).length;
  const tokenCoverage = tokenMatches / Math.max(queryTokens.length, 1);
  const editRatio = Math.min(
    levenshtein(query, fullName) / Math.max(query.length, fullName.length, 1),
    levenshtein(query, model) / Math.max(query.length, model.length, 1),
  );

  return editRatio - tokenCoverage * 0.18;
};

const findNearestDevice = (value) => {
  const query = normalizeSearch(value);
  if (!query || isBrandOnly(query)) return null;

  const recognizedBrand = getRecognizedBrand(query);
  const candidates = recognizedBrand
    ? DEVICE_DATABASE.filter(
        (device) => normalizeSearch(device.brand) === recognizedBrand,
      )
    : DEVICE_DATABASE;

  const ranked = candidates
    .map((device) => ({ device, score: rankDevice(device, query) }))
    .sort((left, right) => left.score - right.score);

  if (!ranked.length) return null;
  const best = ranked[0];
  const brandRequired = query.split(" ").length > 2 || /[a-zа-я]{5,}/iu.test(query);

  if (!recognizedBrand && brandRequired && best.score > 0.2) return null;
  return best.score <= 0.34 ? best.device : null;
};

const modelNameOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const variantOrder = (variant) => {
  if (/pro max/u.test(variant)) return 4;
  if (/pro|ultra/u.test(variant)) return 3;
  if (/plus/u.test(variant)) return 2;
  if (/mini/u.test(variant)) return 1;
  if (/edge/u.test(variant)) return 5;
  if (/fe|^e$/u.test(variant)) return 6;
  return 0;
};

// Catalogue queries follow product generations, independently of fuzzy scores.
const catalogueOrderKey = (device) => {
  const model = normalizeSearch(device.model);
  const iphone = model.match(/^iphone (\d+)(.*)$/u);
  if (iphone) return [0, Number(iphone[1]), variantOrder(iphone[2].trim())];
  const iphoneX = ['iphone x', 'iphone xr', 'iphone xs', 'iphone xs max'].indexOf(model);
  if (iphoneX >= 0) return [0, 10, iphoneX];
  if (model.startsWith('iphone ')) return [1, 0, 0];
  if (model.startsWith('ipad ')) return [2, 0, 0];
  if (model.startsWith('watch ')) return [3, 0, 0];

  const galaxySeries = [/^galaxy s(\d+)(.*)$/u, /^galaxy a(\d+)(.*)$/u,
    /^galaxy z fold (\d+)(.*)$/u, /^galaxy z flip (\d+)(.*)$/u,
    /^galaxy watch (\d+)(.*)$/u];
  for (const [series, pattern] of galaxySeries.entries()) {
    const match = model.match(pattern);
    if (match) return [series, Number(match[1]), variantOrder(match[2].trim())];
  }
  return [99, 0, 0];
};

const compareCatalogueDevices = (left, right) => {
  const leftKey = catalogueOrderKey(left);
  const rightKey = catalogueOrderKey(right);
  for (let index = 0; index < leftKey.length; index += 1) {
    if (leftKey[index] !== rightKey[index]) return leftKey[index] - rightKey[index];
  }
  return modelNameOrder.compare(left.model, right.model);
};

const getSuggestions = (value) => {
  const query = normalizeSearch(value);
  if (!query) return [];
  const recognizedBrand = getRecognizedBrand(query);
  const catalogueQuery = ['apple', 'iphone', 'samsung'].includes(query);

  if (catalogueQuery) {
    return DEVICE_DATABASE
      .filter(device => normalizeSearch(device.brand) === recognizedBrand &&
        (query !== 'iphone' || normalizeSearch(device.model).startsWith('iphone')))
      .sort(compareCatalogueDevices);
  }

  return DEVICE_DATABASE
    .map((device) => ({ device, score: rankDevice(device, query) }))
    .filter(({ device, score }) => {
      if (!Number.isFinite(score)) return false;
      if (!recognizedBrand) return score <= (query.length < 3 ? 0.48 : 0.38);
      return (
        normalizeSearch(device.brand) === recognizedBrand &&
        (query.length < 4 || score <= 0.48)
      );
    })
    .sort((left, right) => left.score - right.score)
    .slice(0, 5)
    .map(({ device }) => device);
};

const findPopularDevice = (label) =>
  DEVICE_DATABASE.find(
    (device) => getPopularName(device) === label || getFullName(device) === label,
  );


export { normalizeSearch, getFullName, getPopularName, getSuggestions, findNearestDevice, findPopularDevice, isBrandOnly };
