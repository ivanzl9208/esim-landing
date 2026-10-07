<script setup>
import { inject, nextTick, onBeforeUnmount, ref, useId } from 'vue';
import { faqCategories } from '../data/faq.js';
import FaqAccordionItem from './FaqAccordionItem.vue';
import { typograph } from '../utils/typography.js';
const uid = useId();
const active = ref(faqCategories[0].id);
const openQuestions = ref({ general: 'general-what' });
const tabStrip = ref(null);
const tabs = ref([]);
const setScrollPosition = inject('setScrollPosition', top => window.scrollTo({ top, behavior: 'instant' }));
let cancelQuestionScroll = () => {};
onBeforeUnmount(() => cancelQuestionScroll());
const select = async (item, focus = false) => {
  if (item.disabled) return;
  cancelQuestionScroll();
  active.value = item.id;
  await nextTick();
  const button = tabs.value.find(tab => tab?.id === `${uid}-tab-${item.id}`);
  if (focus) button?.focus({ preventScroll: true });
  const strip = tabStrip.value;
  if (!strip || !button) return;
  // Scroll only the tabs, never the page or the pinned scene.
  const left = button.offsetLeft;
  if (left < strip.scrollLeft) strip.scrollTo({ left, behavior: 'auto' });
  else if (left + button.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: left + button.offsetWidth - strip.clientWidth, behavior: 'auto' });
};
const toggleQuestion = async (categoryId, questionId, event) => {
  const button = event.currentTarget;
  const previous = openQuestions.value[categoryId];
  const opening = previous !== questionId;
  cancelQuestionScroll();
  openQuestions.value[categoryId] = opening ? questionId : null;
  if (!opening) return;
  await nextTick();
  const targetTop = () => Math.max(0, window.scrollY + button.getBoundingClientRect().top - (window.visualViewport?.offsetTop ?? 0) - 16);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setScrollPosition(targetTop());
    return;
  }
  const startTop = window.scrollY;
  const startTime = performance.now();
  let frame;
  const cancel = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', cancel, true);
    window.removeEventListener('touchstart', cancel, true);
    window.removeEventListener('keydown', interrupt, true);
    cancelQuestionScroll = () => {};
  };
  const interrupt = event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape'].includes(event.key)) cancel();
  };
  const step = now => {
    if (!button.isConnected) { cancel(); return; }
    const progress = Math.min(1, (now - startTime) / 300);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    // Start alongside the accordion transition. Its target moves while the
    // previous answer closes, so read its live position instead of jumping
    // again after the transition has finished.
    setScrollPosition(startTop + (targetTop() - startTop) * eased);
    if (progress < 1) frame = requestAnimationFrame(step);
    else cancel();
  };
  cancelQuestionScroll = cancel;
  window.addEventListener('wheel', cancel, { passive: true, capture: true });
  window.addEventListener('touchstart', cancel, { passive: true, capture: true });
  window.addEventListener('keydown', interrupt, true);
  frame = requestAnimationFrame(step);
};
const keydown = (event, index) => {
  const available = faqCategories.filter(item => !item.disabled);
  const current = available.indexOf(faqCategories[index]);
  let next;
  if (event.key === 'ArrowRight') next = (current + 1) % available.length;
  else if (event.key === 'ArrowLeft') next = (current - 1 + available.length) % available.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = available.length - 1;
  else return;
  event.preventDefault();
  select(available[next], true);
};
</script>
<template>
  <section id="esim-faq" class="faq-section" :aria-labelledby="`${uid}-title`">
    <h2 :id="`${uid}-title`">Остались вопросы?</h2>
    <div ref="tabStrip" class="faq-tabs-scroll" data-lenis-prevent-horizontal>
      <div class="faq-tabs" role="tablist" aria-label="Категории вопросов об eSIM">
        <button v-for="(item, index) in faqCategories" :id="`${uid}-tab-${item.id}`" :key="item.id" ref="tabs" type="button" role="tab"
          :aria-selected="active === item.id" :aria-controls="`${uid}-panel-${item.id}`" :tabindex="active === item.id ? 0 : -1" :disabled="item.disabled"
          @click="select(item)" @keydown="keydown($event, index)">{{ typograph(item.label) }}</button>
      </div>
    </div>
    <div v-for="item in faqCategories" :id="`${uid}-panel-${item.id}`" :key="item.id" role="tabpanel" :aria-labelledby="`${uid}-tab-${item.id}`" :hidden="active !== item.id" tabindex="0" class="faq-panel">
      <FaqAccordionItem v-for="question in item.questions" :id="`${uid}-${question.id}`" :key="question.id" :item="question" :open="openQuestions[item.id] === question.id"
        @toggle="toggleQuestion(item.id, question.id, $event)" />
    </div>
  </section>
</template>
