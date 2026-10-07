import { computed, nextTick, onMounted, onScopeDispose, ref } from 'vue';
import { getFullName, getSuggestions, findNearestDevice, isBrandOnly } from '../utils/deviceSearch.js';
import { createSuggestionPointer } from '../utils/suggestionPointer.js';

export const CHECK_DELAY = 720;
export const TOAST_DURATION = 3000;

export function useDeviceChecker(input, resultHeading, beforeResult) {
  const query = ref('');
  const state = ref('form');
  const focused = ref(false);
  const selection = ref(null);
  const toastVisible = ref(false);
  const toastMessage = ref('');
  const invalidQuery = ref(false);
  const activeIndex = ref(-1);
  const statusMessage = ref('');
  const preparing = ref(false);
  const busy = computed(() => preparing.value || state.value === 'loading');
  const suggestions = computed(() => getSuggestions(query.value));
  const expanded = computed(() => state.value === 'form' && focused.value && !invalidQuery.value && query.value.trim().length > 0 && suggestions.value.length > 0);
  let checkTimer;
  let toastTimer;
  let disposed = true;
  let request = 0;
  const reconcileFocus = () => {
    if (!disposed && document.activeElement !== input.value) {
      focused.value = false;
      activeIndex.value = -1;
    }
  };
  const pointer = createSuggestionPointer(device => choose(device), reconcileFocus);
  onMounted(() => {
    disposed = false;
    window.addEventListener('pointermove', pointer.move, { passive: true });
    window.addEventListener('pointerup', pointer.cancel);
    window.addEventListener('pointercancel', pointer.cancel);
  });
  const blurInput = () => {
    if (!pointer.active) { focused.value = false; activeIndex.value = -1; }
  };

  const focusInput = async () => {
    await nextTick();
    if (!disposed) input.value?.focus({ preventScroll: true });
  };
  const hideToast = () => {
    clearTimeout(toastTimer);
    toastTimer = undefined;
    toastVisible.value = false;
  };
  const runCheck = async (device = null, submitted = query.value) => {
    if (disposed || busy.value || (!device && !submitted.trim())) return;
    const currentRequest = ++request;
    const resolved = device ?? findNearestDevice(submitted.trim());
    clearTimeout(checkTimer);
    hideToast();
    invalidQuery.value = false;
    focused.value = false;
    activeIndex.value = -1;
    preparing.value = true;
    // Capture the reduced viewport before blur starts the keyboard dismissal.
    const preparation = resolved ? beforeResult?.() : undefined;
    input.value?.blur();
    await preparation;
    if (disposed || currentRequest !== request) return;
    preparing.value = false;
    state.value = 'loading';
    statusMessage.value = 'Проверяем устройство';
    checkTimer = setTimeout(async () => {
      checkTimer = undefined;
      if (disposed || currentRequest !== request) return;
      if (!resolved) {
        selection.value = null;
        state.value = 'form';
        invalidQuery.value = true;
        statusMessage.value = '';
        toastMessage.value = isBrandOnly(submitted)
          ? 'Введите модель устройства'
          : 'Устройство не найдено, измените модель';
        toastVisible.value = true;
        toastTimer = setTimeout(hideToast, TOAST_DURATION);
        await focusInput();
        // Keep real focus so the visualViewport keyboard layout stays active.
        // invalidQuery hides suggestions until the user edits the submitted query.
        return;
      }
      query.value = getFullName(resolved);
      selection.value = resolved;
      state.value = 'result';
      statusMessage.value = '';
      await nextTick();
      if (!disposed) resultHeading.value?.focus({ preventScroll: true });
    }, CHECK_DELAY);
  };
  const reset = async () => {
    request++;
    preparing.value = false;
    clearTimeout(checkTimer);
    checkTimer = undefined;
    hideToast();
    query.value = '';
    invalidQuery.value = false;
    selection.value = null;
    state.value = 'form';
    statusMessage.value = '';
    activeIndex.value = -1;
    focused.value = false;
    await focusInput();
  };
  const choose = (device) => {
    if (disposed || busy.value || state.value !== 'form') return;
    query.value = getFullName(device);
    activeIndex.value = -1;
    runCheck(device, query.value);
  };
  const changeQuery = (value) => {
    query.value = value;
    invalidQuery.value = false;
    activeIndex.value = -1;
    focused.value = true;
    hideToast();
  };
  const clearQuery = async () => {
    query.value = '';
    invalidQuery.value = false;
    activeIndex.value = -1;
    hideToast();
    await focusInput();
  };
  const keydown = (event) => {
    if (event.isComposing) return;
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.value.length) {
      event.preventDefault();
      focused.value = true;
      activeIndex.value = activeIndex.value < 0
        ? (event.key === 'ArrowDown' ? 0 : suggestions.value.length - 1)
        : (activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.value.length) % suggestions.value.length;
      nextTick(() => {
        if (!disposed) document.getElementById(input.value?.getAttribute('aria-activedescendant'))?.scrollIntoView({ block: 'nearest' });
      });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (expanded.value && suggestions.value[activeIndex.value]) choose(suggestions.value[activeIndex.value]);
      else runCheck();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      activeIndex.value = -1;
      focused.value = false;
      hideToast();
    }
  };
  onScopeDispose(() => {
    disposed = true;
    request++;
    window.removeEventListener('pointermove', pointer.move);
    window.removeEventListener('pointerup', pointer.cancel);
    window.removeEventListener('pointercancel', pointer.cancel);
    clearTimeout(checkTimer);
    clearTimeout(toastTimer);
  });
  return { query, state, busy, focused, selection, toastVisible, toastMessage, invalidQuery, activeIndex, statusMessage, suggestions, expanded, hideToast, runCheck, reset, choose, changeQuery, clearQuery, keydown, focusInput, blurInput, optionPointerDown: pointer.down, optionPointerUp: pointer.up, optionClick: pointer.click };
}
