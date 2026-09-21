<script setup>
import { nextTick, ref, useId } from 'vue';
import { faqCategories } from '../data/faq.js';
import FaqAccordionItem from './FaqAccordionItem.vue';
const uid = useId();
const active = ref(faqCategories[0].id);
const openQuestions = ref({ general: 'general-what' });
const tabStrip = ref(null);
const tabs = ref([]);
const select = async (item, focus = false) => {
  if (item.disabled) return;
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
          @click="select(item)" @keydown="keydown($event, index)">{{ item.label }}</button>
      </div>
    </div>
    <div v-for="item in faqCategories" :id="`${uid}-panel-${item.id}`" :key="item.id" role="tabpanel" :aria-labelledby="`${uid}-tab-${item.id}`" :hidden="active !== item.id" tabindex="0" class="faq-panel">
      <FaqAccordionItem v-for="question in item.questions" :id="`${uid}-${question.id}`" :key="question.id" :item="question" :open="openQuestions[item.id] === question.id"
        @toggle="openQuestions[item.id] = openQuestions[item.id] === question.id ? null : question.id" />
    </div>
  </section>
</template>
