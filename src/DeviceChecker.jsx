import React, { useEffect, useMemo, useRef, useState } from "react";
import { DEVICE_DATABASE, POPULAR_DEVICE_NAMES } from "./deviceDatabase.js";

const ASSET_ROOT = `${import.meta.env.BASE_URL}assets`;
const CHECK_DELAY = 720;
const TOAST_DURATION = 10000;

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

  if (fullName === query || model === query) return 0;
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

const getSuggestions = (value) => {
  const query = normalizeSearch(value);
  if (!query) return [];
  const recognizedBrand = getRecognizedBrand(query);

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

function DeviceResult({ device, onReset }) {
  const supportsEsim = device.supportsEsim;
  const fullName = getFullName(device);

  return (
    <div className="checker-result" aria-live="polite">
      <div className="checker-result-card">
        <div className="checker-result-summary">
          <img
            className="checker-result-image"
            src={`${ASSET_ROOT}/${supportsEsim ? "esim-check-success.png" : "esim-check-fail.png"}`}
            alt=""
          />
          <div className="checker-result-copy">
            <h2>
              <span className="checker-result-model">{fullName}</span>
              <span>{supportsEsim ? "поддерживает eSIM" : "не поддерживает eSIM"}</span>
            </h2>
            <p>
              {supportsEsim
                ? "Кроме версии для китайского рынка с двумя сим-картами"
                : "Это не помешает подключиться — закажите пластиковую сим-карту с бесплатной доставкой и скидкой 30% на 3 месяца"}
            </p>
          </div>
        </div>
        <div className="checker-result-actions" aria-label="Дальнейшие действия">
          <button type="button" disabled>
            {supportsEsim ? "Подключить eSIM" : "Заказать сим-карту"}
          </button>
          <button
            className="checker-result-secondary"
            type="button"
            onClick={onReset}
          >
            У меня другое устройство
          </button>
        </div>
      </div>
    </div>
  );
}

function DeviceChecker() {
  const sectionRef = useRef(null);
  const inputRef = useRef(null);
  const checkTimerRef = useRef(0);
  const toastTimerRef = useRef(0);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("form");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const suggestions = useMemo(() => getSuggestions(query), [query]);
  const showSuggestions =
    state === "form" && isFocused && query.trim().length > 0 && suggestions.length > 0;

  const hideToast = () => {
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = 0;
    setToastVisible(false);
  };

  const showNotFound = () => {
    hideToast();
    setToastVisible(true);
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
      toastTimerRef.current = 0;
    }, TOAST_DURATION);
  };

  const runCheck = (device = null, submittedValue = query) => {
    const enteredValue = submittedValue.trim();
    if (!device && !enteredValue) return;

    window.clearTimeout(checkTimerRef.current);
    hideToast();
    setIsFocused(false);
    inputRef.current?.blur();
    setState("loading");

    checkTimerRef.current = window.setTimeout(() => {
      const resolvedDevice = device ?? findNearestDevice(enteredValue);
      checkTimerRef.current = 0;

      if (!resolvedDevice) {
        setSelectedDevice(null);
        setState("form");
        showNotFound();
        return;
      }

      setQuery(getFullName(resolvedDevice));
      setSelectedDevice(resolvedDevice);
      setState("result");
    }, CHECK_DELAY);
  };

  const clearField = () => {
    window.clearTimeout(checkTimerRef.current);
    checkTimerRef.current = 0;
    hideToast();
    setQuery("");
    setSelectedDevice(null);
    setState("form");
    setActiveSuggestion(-1);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const resetCheck = () => {
    window.clearTimeout(checkTimerRef.current);
    checkTimerRef.current = 0;
    hideToast();
    setQuery("");
    setSelectedDevice(null);
    setState("form");
    setActiveSuggestion(-1);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const chooseDevice = (device) => {
    setQuery(getFullName(device));
    setActiveSuggestion(-1);
    runCheck(device, getFullName(device));
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setIsFocused(true);
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setIsFocused(true);
      setActiveSuggestion(
        (current) => current < 0 ? suggestions.length - 1 : (current - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (showSuggestions && suggestions[activeSuggestion]) {
        chooseDevice(suggestions[activeSuggestion]);
      } else {
        runCheck();
      }
    } else if (event.key === "Escape") {
      setActiveSuggestion(-1);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const viewport = window.visualViewport;
    const section = sectionRef.current;
    if (!viewport || !section) return undefined;

    const syncKeyboardOffset = () => {
      const offset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      section.style.setProperty("--checker-keyboard-offset", `${offset}px`);
      section.dataset.keyboardOpen = offset > 100 ? "true" : "false";
    };

    syncKeyboardOffset();
    viewport.addEventListener("resize", syncKeyboardOffset);
    viewport.addEventListener("scroll", syncKeyboardOffset);

    return () => {
      viewport.removeEventListener("resize", syncKeyboardOffset);
      viewport.removeEventListener("scroll", syncKeyboardOffset);
    };
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(checkTimerRef.current);
      window.clearTimeout(toastTimerRef.current);
    },
    [],
  );

  return (
    <section
      className={`device-checker is-${state}${isFocused ? " is-focused" : ""}`}
      ref={sectionRef}
      aria-label="Проверка поддержки eSIM"
    >
      <div className="checker-panel">
        {state === "result" && selectedDevice ? (
          <DeviceResult device={selectedDevice} onReset={resetCheck} />
        ) : (
          <div className="checker-form-view">
            <h2 className="checker-heading">Ваше устройство готово к eSIM?</h2>

            <div className="checker-popular">
              <p>Популярные модели</p>
              <div className="checker-popular-list">
                {POPULAR_DEVICE_NAMES.map((label) => {
                  const device = findPopularDevice(label);
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => device && chooseDevice(device)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              className="checker-search-area"
              onSubmit={(event) => {
                event.preventDefault();
                runCheck();
              }}
            >
              <div
                className={`checker-suggestions${showSuggestions ? " is-visible" : ""}`}
                id="device-suggestions"
                onPointerMove={() => setActiveSuggestion(-1)}
                role="listbox"
              >
                {suggestions.map((device, index) => (
                  <button
                    className={index === activeSuggestion ? "is-active" : ""}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestion}
                    key={getFullName(device)}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => chooseDevice(device)}
                  >
                    {getFullName(device)}
                  </button>
                ))}
              </div>

              <div className="checker-input-shell">
                <input
                  ref={inputRef}
                  value={query}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="Введите модель устройства"
                  aria-label="Модель устройства"
                  aria-controls="device-suggestions"
                  aria-expanded={showSuggestions}
                  aria-autocomplete="list"
                  disabled={state === "loading"}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => { setIsFocused(false); setActiveSuggestion(-1); }}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveSuggestion(-1);
                    hideToast();
                  }}
                  onKeyDown={handleKeyDown}
                />

                {state === "loading" ? (
                  <span className="checker-input-action checker-loader" aria-label="Проверяем устройство" />
                ) : query ? (
                  <button
                    className="checker-input-action"
                    type="button"
                    aria-label="Очистить поле"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={clearField}
                  >
                    <img src={`${ASSET_ROOT}/esim-clear.svg`} alt="" />
                  </button>
                ) : (
                  <span className="checker-input-action is-disabled" aria-hidden="true">
                    <img src={`${ASSET_ROOT}/esim-search.svg`} alt="" />
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        <p className="checker-eid-hint">
          Или наберите *#06# на устройстве и нажмите кнопку вызова. eSIM доступна,
          если в списке есть строка EID
        </p>

        <div
          className={`checker-toast${toastVisible ? " is-visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          <div className="checker-toast-main">
            <img className="checker-toast-alert" src={`${ASSET_ROOT}/esim-alert.svg`} alt="" />
            <span>Устройство не найдено, измените модель</span>
          </div>
          <button type="button" aria-label="Закрыть уведомление" onClick={hideToast}>
            <img src={`${ASSET_ROOT}/esim-toast-close.svg`} alt="" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default DeviceChecker;
