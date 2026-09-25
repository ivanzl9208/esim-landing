<script setup>
import { ref, useId, watch } from 'vue';
import { POPULAR_DEVICE_NAMES } from '../data/deviceDatabase.js';
import { findPopularDevice, getFullName } from '../utils/deviceSearch.js';
import { asset } from '../utils/assets.js';
import { useDeviceChecker } from '../composables/useDeviceChecker.js';
import { useKeyboardViewport } from '../composables/useKeyboardViewport.js';
import PopularModels from './PopularModels.vue';

const section = ref(null);
const input = ref(null);
const resultHeading = ref(null);
const uid = useId();
const inputId = `${uid}-model`;
const listId = `${uid}-suggestions`;
const hintId = `${uid}-eid`;
const hint = 'Или наберите *#06# на устройстве и нажмите кнопку вызова. eSIM доступна, если в списке есть строка EID';
const optionId = index => `${uid}-option-${index}`;
const popular = POPULAR_DEVICE_NAMES.map(label => ({ label, device: findPopularDevice(label) }));
const { query, state, focused, selection, toastVisible, activeIndex, statusMessage, suggestions, expanded, hideToast, runCheck, reset, choose, changeQuery, keydown, focusInput } = useDeviceChecker(input, resultHeading);
useKeyboardViewport(section);
// On a short screen the form may have been scrolled internally. Start the
// result at its heading without moving the surrounding document flow.
watch(state, value => {
  if (value === 'result' && section.value) section.value.scrollTop = 0;
}, { flush: 'post' });
defineExpose({ focusInput, section });
</script>
<template>
  <section id="device-checker" ref="section" :class="['device-checker', `is-${state}`, { 'is-focused': focused }]" aria-label="Проверка поддержки eSIM">
    <div class="checker-panel">
      <div v-if="state === 'result' && selection" class="checker-result">
        <div class="checker-result-card">
          <div class="checker-result-summary">
            <img draggable="false" class="checker-result-image" :src="asset(selection.supportsEsim ? 'esim-check-success.png' : 'esim-check-fail.png')" alt="" />
            <div class="checker-result-copy">
              <h2 ref="resultHeading" tabindex="-1">
                <span class="checker-result-model">{{ getFullName(selection) }}</span>
                <span>{{ selection.supportsEsim ? 'поддерживает eSIM' : 'не поддерживает eSIM' }}</span>
              </h2>
              <p>{{ selection.supportsEsim ? 'Кроме версии для китайского рынка с двумя сим-картами' : 'Это не помешает подключиться — закажите пластиковую сим-карту с бесплатной доставкой и скидкой 30% на 3 месяца' }}</p>
            </div>
          </div>
          <div class="checker-result-actions">
            <button type="button" disabled>{{ selection.supportsEsim ? 'Подключить eSIM' : 'Заказать сим-карту' }}</button>
            <button class="checker-result-secondary" type="button" @click="reset">У меня другое устройство</button>
          </div>
        </div>
        <p :id="hintId" class="checker-eid-hint">{{ hint }}</p>
      </div>
      <div v-else class="checker-form-view" :aria-busy="state === 'loading'">
        <h2 class="checker-heading"><span>Ваше устройство готово к eSIM?</span></h2>
        <div class="checker-popular">
          <p>Популярные модели</p>
          <PopularModels :items="popular" :loading="state === 'loading'" @choose="choose" />
        </div>
        <div class="checker-search-dock">
          <form class="checker-search-area" @submit.prevent="runCheck()">
            <div :id="listId" :class="['checker-suggestions', { 'is-visible': expanded }]" role="listbox" aria-label="Модели устройств" data-lenis-prevent @pointermove="activeIndex = -1">
              <div v-for="(device, index) in suggestions" :id="optionId(index)" :key="getFullName(device)"
                :class="['checker-option', { 'is-active': index === activeIndex }]" role="option" :aria-selected="index === activeIndex"
                @pointerdown.prevent @click="choose(device)">{{ getFullName(device) }}</div>
            </div>
            <div class="checker-input-shell">
              <label class="sr-only" :for="inputId">Модель устройства</label>
              <input :id="inputId" ref="input" :value="query" type="search" role="combobox" enterkeyhint="search"
                autocomplete="off" :spellcheck="false" placeholder="Введите модель устройства"
                :aria-controls="listId" :aria-expanded="expanded" aria-autocomplete="list" aria-haspopup="listbox"
                :aria-activedescendant="expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined" :aria-describedby="hintId"
                :disabled="state === 'loading'" @focus="focused = true" @blur="focused = false; activeIndex = -1"
                @input="changeQuery($event.target.value)" @keydown="keydown" />
              <span v-if="state === 'loading'" class="checker-input-action checker-loader" aria-hidden="true" />
              <Transition name="checker-search" :duration="{ enter: 180, leave: state === 'loading' ? 0 : 400 }">
                <button v-show="query.trim() && state !== 'loading'" :inert="!query.trim() || state === 'loading'" :disabled="!query.trim() || state === 'loading'" class="checker-input-action checker-input-submit" type="submit" aria-label="Проверить устройство" @pointerdown.prevent>
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
        <div class="checker-toast-main"><img draggable="false" class="checker-toast-alert" :src="asset('esim-alert.svg')" alt="" /><span>Устройство не найдено, измените модель</span></div>
        <button type="button" aria-label="Закрыть уведомление" @click="hideToast"><img draggable="false" :src="asset('esim-toast-close.svg')" alt="" /></button>
      </div>
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ toastVisible ? 'Устройство не найдено, измените модель' : statusMessage }}</p>
    </div>
  </section>
</template>
