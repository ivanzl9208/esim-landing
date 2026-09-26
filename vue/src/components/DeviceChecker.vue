<script setup>
import { onScopeDispose, ref, useId, watch } from 'vue';
import { POPULAR_DEVICE_NAMES } from '../data/deviceDatabase.js';
import { findPopularDevice, getFullName } from '../utils/deviceSearch.js';
import { asset } from '../utils/assets.js';
import { useDeviceChecker } from '../composables/useDeviceChecker.js';
import { useKeyboardViewport } from '../composables/useKeyboardViewport.js';
import PopularModels from './PopularModels.vue';
import { typograph } from '../utils/typography.js';

const props = defineProps({ prepareResult: Function });
const section = ref(null);
const input = ref(null);
const resultHeading = ref(null);
const changingView = ref(false);
let viewTimer;
const uid = useId();
const inputId = `${uid}-model`;
const listId = `${uid}-suggestions`;
const hintId = `${uid}-eid`;
const hint = typograph('Или наберите *#06# на устройстве и нажмите кнопку вызова. eSIM доступна, если в списке есть строка EID');
const optionId = index => `${uid}-option-${index}`;
const popular = POPULAR_DEVICE_NAMES.map(label => ({ label, device: findPopularDevice(label) }));
const { waitForKeyboardClose } = useKeyboardViewport(section);
const prepareResult = async () => {
  await waitForKeyboardClose();
  await props.prepareResult?.();
};
const { query, state, busy, focused, selection, toastVisible, toastMessage, invalidQuery, activeIndex, statusMessage, suggestions, expanded, hideToast, runCheck, reset, choose, changeQuery, clearQuery, keydown, focusInput, blurInput, optionPointerDown, optionPointerUp, optionClick } = useDeviceChecker(input, resultHeading, prepareResult);
// On a short screen the form may have been scrolled internally. Start the
// result at its heading without moving the surrounding document flow.
watch(state, (value, previous) => {
  // The initial view is revealed by the scroll composition, not a second
  // mount animation. Limit local keyframes to real form/result changes and
  // remove them explicitly, including when WebKit suspends its document clock.
  if (value === 'result' || previous === 'result') {
    clearTimeout(viewTimer);
    changingView.value = true;
    viewTimer = setTimeout(() => { changingView.value = false; }, 440);
  }
  if (value === 'result' && section.value) section.value.scrollTop = 0;
}, { flush: 'post' });
onScopeDispose(() => clearTimeout(viewTimer));
defineExpose({ focusInput, section });
</script>
<template>
  <section id="device-checker" ref="section" :class="['device-checker', `is-${state}`, { 'is-focused': focused }]" aria-label="Проверка поддержки eSIM">
    <div class="checker-panel" :class="{ 'is-changing': changingView }">
      <div v-if="state === 'result' && selection" class="checker-result">
        <div class="checker-result-card">
          <div class="checker-result-summary">
            <img draggable="false" class="checker-result-image" :src="asset(selection.supportsEsim ? 'esim-check-success.png' : 'esim-check-fail.png')" alt="" />
            <div class="checker-result-copy">
              <h2 ref="resultHeading" tabindex="-1">
                <span class="checker-result-model">{{ getFullName(selection) }}</span>
                <span>{{ typograph(selection.supportsEsim ? 'поддерживает eSIM' : 'не поддерживает eSIM') }}</span>
              </h2>
              <p>{{ typograph(selection.supportsEsim ? 'Кроме версии для китайского рынка с двумя сим-картами' : 'Это не помешает подключиться — закажите пластиковую сим-карту с бесплатной доставкой и скидкой 30% на 3 месяца') }}</p>
            </div>
          </div>
          <div class="checker-result-actions">
            <button type="button" disabled>{{ selection.supportsEsim ? 'Подключить eSIM' : 'Заказать сим-карту' }}</button>
            <button class="checker-result-secondary" type="button" @click="reset">{{ typograph('У меня другое устройство') }}</button>
          </div>
        </div>
        <p :id="hintId" class="checker-eid-hint">{{ hint }}</p>
      </div>
      <div v-else class="checker-form-view" :aria-busy="busy">
        <h2 class="checker-heading"><span>{{ typograph('Ваше устройство готово к eSIM?') }}</span></h2>
        <div class="checker-popular">
          <p>Популярные модели</p>
          <PopularModels :items="popular" :loading="busy" @choose="choose" />
        </div>
        <div class="checker-search-dock">
          <form class="checker-search-area" @submit.prevent="runCheck()">
            <div :id="listId" :class="['checker-suggestions', { 'is-visible': expanded }]" role="listbox" aria-label="Модели устройств" data-lenis-prevent @pointermove="$event.pointerType === 'mouse' && (activeIndex = -1)">
              <div v-for="(device, index) in suggestions" :id="optionId(index)" :key="getFullName(device)"
                :class="['checker-option', { 'is-active': index === activeIndex }]" role="option" :aria-selected="index === activeIndex"
                @pointerdown="optionPointerDown($event, device)" @pointerup="optionPointerUp" @click="optionClick($event, device)">{{ getFullName(device) }}</div>
            </div>
            <div class="checker-input-shell">
              <label class="sr-only" :for="inputId">Модель устройства</label>
              <input :id="inputId" ref="input" :value="query" type="search" role="combobox" enterkeyhint="search"
                autocomplete="off" :spellcheck="false" placeholder="Введите модель устройства"
                :aria-controls="listId" :aria-expanded="expanded" aria-autocomplete="list" aria-haspopup="listbox"
                :aria-activedescendant="expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined" :aria-describedby="hintId"
                :disabled="busy" @focus="focused = true" @blur="blurInput"
                @input="changeQuery($event.target.value)" @keydown="keydown" />
              <span v-if="state === 'loading'" class="checker-input-action checker-loader" aria-hidden="true" />
              <button v-if="invalidQuery && query.trim() && state === 'form'" class="checker-input-action checker-input-clear" type="button" aria-label="Очистить поле" @click="clearQuery">
                <img draggable="false" :src="asset('esim-clear.svg')" width="24" height="24" alt="" />
              </button>
              <Transition name="checker-search" :duration="{ enter: 180, leave: state === 'loading' ? 0 : 400 }">
                <button v-show="query.trim() && !invalidQuery && state !== 'loading'" :inert="!query.trim() || invalidQuery || busy" :disabled="!query.trim() || invalidQuery || busy" class="checker-input-action checker-input-submit" type="submit" aria-label="Проверить устройство" @pointerdown.prevent>
                  <svg class="checker-search-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
                    <path class="checker-search-handle" d="M19.5 19.5 16.45 16.45" pathLength="1" />
                    <circle class="checker-search-ring" cx="11.5" cy="11.5" r="7" transform="rotate(45 11.5 11.5)" pathLength="1" />
                  </svg>
                </button>
              </Transition>
            </div>
          </form>
          <p :id="hintId" class="checker-eid-hint">{{ hint }}</p>
        </div>
      </div>
      <div :class="['checker-toast', { 'is-visible': toastVisible }]" :inert="!toastVisible">
        <div class="checker-toast-main"><img draggable="false" class="checker-toast-alert" :src="asset('esim-alert.svg')" alt="" /><span>{{ typograph(toastMessage) }}</span></div>
        <button type="button" aria-label="Закрыть уведомление" @click="hideToast"><img draggable="false" :src="asset('esim-toast-close.svg')" alt="" /></button>
      </div>
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ toastVisible ? toastMessage : statusMessage }}</p>
    </div>
  </section>
</template>
