<script setup>
import { ref, useId } from 'vue';
import { POPULAR_DEVICE_NAMES } from '../data/deviceDatabase.js';
import { findPopularDevice, getFullName } from '../utils/deviceSearch.js';
import { asset } from '../utils/assets.js';
import { useDeviceChecker } from '../composables/useDeviceChecker.js';
import { useKeyboardViewport } from '../composables/useKeyboardViewport.js';

const section = ref(null);
const input = ref(null);
const resultHeading = ref(null);
const uid = useId();
const inputId = `${uid}-model`;
const listId = `${uid}-suggestions`;
const hintId = `${uid}-eid`;
const optionId = index => `${uid}-option-${index}`;
const popular = POPULAR_DEVICE_NAMES.map(label => ({ label, device: findPopularDevice(label) }));
const { query, state, focused, selection, toastVisible, activeIndex, statusMessage, suggestions, expanded, hideToast, runCheck, reset, choose, changeQuery, keydown, focusInput } = useDeviceChecker(input, resultHeading);
useKeyboardViewport(section);
defineExpose({ focusInput });
</script>
<template>
  <section id="device-checker" ref="section" :class="['device-checker', `is-${state}`, { 'is-focused': focused }]" aria-label="Проверка поддержки eSIM" inert>
    <div class="checker-panel">
      <div v-if="state === 'result' && selection" class="checker-result">
        <div class="checker-result-card">
          <div class="checker-result-summary">
            <img class="checker-result-image" :src="asset(selection.supportsEsim ? 'esim-check-success.png' : 'esim-check-fail.png')" alt="" />
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
      </div>
      <div v-else class="checker-form-view" :aria-busy="state === 'loading'">
        <h2 class="checker-heading">Ваше устройство готово к eSIM?</h2>
        <div class="checker-popular">
          <p>Популярные модели</p>
          <div class="checker-popular-list">
            <button v-for="item in popular" :key="item.label" type="button" :disabled="state === 'loading'" @click="choose(item.device)">{{ item.label }}</button>
          </div>
        </div>
        <form class="checker-search-area" @submit.prevent="runCheck()">
          <div :id="listId" :class="['checker-suggestions', { 'is-visible': expanded }]" role="listbox" aria-label="Модели устройств" data-lenis-prevent>
            <div v-for="(device, index) in suggestions" :id="optionId(index)" :key="getFullName(device)"
              :class="['checker-option', { 'is-active': index === activeIndex }]" role="option" :aria-selected="index === activeIndex"
              @pointerdown.prevent @click="choose(device)">{{ getFullName(device) }}</div>
          </div>
          <div class="checker-input-shell">
            <label class="sr-only" :for="inputId">Модель устройства</label>
            <input :id="inputId" ref="input" :value="query" type="search" role="combobox" enterkeyhint="search"
              autocomplete="off" :spellcheck="false" placeholder="Введите модель устройства"
              :aria-controls="listId" :aria-expanded="expanded" aria-autocomplete="list" aria-haspopup="listbox"
              :aria-activedescendant="expanded ? optionId(activeIndex) : undefined" :aria-describedby="hintId"
              :disabled="state === 'loading'" @focus="focused = true" @blur="focused = false"
              @input="changeQuery($event.target.value)" @keydown="keydown" />
            <span v-if="state === 'loading'" class="checker-input-action checker-loader" aria-hidden="true" />
            <button v-else-if="query" class="checker-input-action" type="button" aria-label="Очистить поле" @pointerdown.prevent @click="reset"><img :src="asset('esim-clear.svg')" alt="" /></button>
            <span v-else class="checker-input-action is-disabled" aria-hidden="true"><img :src="asset('esim-search.svg')" alt="" /></span>
          </div>
          <button class="sr-only focus-reveal-submit" type="submit" :disabled="state === 'loading' || !query.trim()">Проверить устройство</button>
        </form>
      </div>
      <p :id="hintId" class="checker-eid-hint">Или наберите *#06# на устройстве и нажмите кнопку вызова. eSIM доступна, если в списке есть строка EID</p>
      <div :class="['checker-toast', { 'is-visible': toastVisible }]" :inert="!toastVisible">
        <div class="checker-toast-main"><img class="checker-toast-alert" :src="asset('esim-alert.svg')" alt="" /><span>Устройство не найдено, измените модель</span></div>
        <button type="button" aria-label="Закрыть уведомление" @click="hideToast"><img :src="asset('esim-toast-close.svg')" alt="" /></button>
      </div>
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ toastVisible ? 'Устройство не найдено, измените модель' : statusMessage }}</p>
    </div>
  </section>
</template>
