import { computed, nextTick, onMounted, onScopeDispose, ref } from 'vue';
import { getFullName, getSuggestions, findNearestDevice } from '../utils/deviceSearch.js';

export const CHECK_DELAY = 720;
export const TOAST_DURATION = 3000;

export function useDeviceChecker(input, resultHeading) {
  const query = ref('');
  const state = ref('form');
  const focused = ref(false);
  const selection = ref(null);
  const toastVisible = ref(false);
  const activeIndex = ref(-1);
  const statusMessage = ref('');
  const suggestions = computed(() => getSuggestions(query.value));
  const expanded = computed(() => state.value === 'form' && focused.value && query.value.trim().length > 0 && suggestions.value.length > 0);
  let checkTimer;
  let toastTimer;
  let disposed = true;
  onMounted(() => { disposed = false; });

  const focusInput = async () => {
    await nextTick();
    if (!disposed) input.value?.focus({ preventScroll: true });
  };
  const hideToast = () => {
    clearTimeout(toastTimer);
    toastTimer = undefined;
    toastVisible.value = false;
  };
  const runCheck = (device = null, submitted = query.value) => {
    if (disposed || (!device && !submitted.trim())) return;
    clearTimeout(checkTimer);
    hideToast();
    focused.value = false;
    input.value?.blur();
    state.value = 'loading';
    statusMessage.value = 'Проверяем устройство';
    checkTimer = setTimeout(async () => {
      checkTimer = undefined;
      if (disposed) return;
      const resolved = device ?? findNearestDevice(submitted.trim());
      if (!resolved) {
        selection.value = null;
        state.value = 'form';
        statusMessage.value = '';
        toastVisible.value = true;
        toastTimer = setTimeout(hideToast, TOAST_DURATION);
        await focusInput();
        // Keep the submitted query available for correction, without reopening suggestions.
        focused.value = false;
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
    clearTimeout(checkTimer);
    checkTimer = undefined;
    hideToast();
    query.value = '';
    selection.value = null;
    state.value = 'form';
    statusMessage.value = '';
    activeIndex.value = -1;
    focused.value = false;
    await focusInput();
  };
  const choose = (device) => {
    query.value = getFullName(device);
    activeIndex.value = -1;
    runCheck(device, query.value);
  };
  const changeQuery = (value) => {
    query.value = value;
    activeIndex.value = -1;
    focused.value = true;
    hideToast();
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
    clearTimeout(checkTimer);
    clearTimeout(toastTimer);
  });
  return { query, state, focused, selection, toastVisible, activeIndex, statusMessage, suggestions, expanded, hideToast, runCheck, reset, choose, changeQuery, keydown, focusInput };
}
