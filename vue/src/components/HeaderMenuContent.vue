<script setup>
defineProps({ section: { type: Object, required: true }, compact: Boolean });
</script>

<template>
  <div :class="['header-menu-content', { 'is-compact': compact }]">
    <div class="header-menu-grid">
      <div class="header-menu-cards">
        <a v-for="card in section.cards" :key="card.href" :href="card.href" class="header-menu-card">
          <strong>{{ card.title }}</strong><span>{{ card.text }}</span>
          <img :src="card.img" draggable="false" width="96" height="96" alt="" loading="lazy" />
        </a>
      </div>
      <nav class="header-menu-links" :aria-label="section.title">
        <a v-for="link in section.links" :key="link.href" :href="link.href">
          <img :src="link.img" draggable="false" width="36" height="36" alt="" loading="lazy" /><span>{{ link.label }}</span>
        </a>
      </nav>
      <a class="header-menu-banner" :href="section.banner.href">
        <img :src="section.banner.img" draggable="false" alt="" loading="lazy" />
        <div><strong>{{ section.banner.title }}</strong><span>{{ section.banner.label }}</span></div>
      </a>
    </div>
    <nav v-if="!compact" class="header-menu-quick" aria-label="Быстрые ссылки">
      <a v-for="link in section.quick" :key="link.href" :href="link.href">{{ link.label }}</a>
    </nav>
  </div>
</template>

<style scoped>
.header-menu-content { color: rgba(11,12,13,.86); font: 400 16px/22px "SB Sans Text", Arial, sans-serif; letter-spacing: -.5px; }
.header-menu-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr) 280px; gap: 16px; padding: 24px; border-radius: 32px; background: #f4f4f4; }
.header-menu-cards { display: flex; flex-direction: column; gap: 16px; }
.header-menu-card { position: relative; display: flex; flex: 1; flex-direction: column; gap: 4px; min-height: 180px; padding: 20px 20px 100px; border-radius: 24px; background: #fff; }
.header-menu-card strong { font: 600 18px/22px "SB Sans Display", Arial, sans-serif; }
.header-menu-card span { font-size: 15px; line-height: 18px; color: rgba(10,11,11,.72); }
.header-menu-card img { position: absolute; right: 20px; bottom: 20px; width: 64px; height: 64px; object-fit: contain; }
.header-menu-links { display: flex; flex-direction: column; gap: 16px; padding: 20px; border-radius: 24px; background: #fff; }
.header-menu-links a { display: flex; align-items: center; gap: 16px; }
.header-menu-links img { flex: 0 0 32px; width: 32px; height: 36px; padding: 10px 8px; border-radius: 8px; background: #f4f4f4; }
.header-menu-content a:hover { color: #fa5f05; }
.header-menu-banner { position: relative; display: flex; align-items: flex-end; padding: 20px; overflow: hidden; border-radius: 24px; color: #fff; background: #494642; }
.header-menu-banner > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.header-menu-banner::after { content: ''; position: absolute; inset: 40% 0 0; background: linear-gradient(transparent,rgba(0,0,0,.65)); }
.header-menu-banner > div { position: relative; z-index: 1; }
.header-menu-banner strong { display: block; font: 600 24px/24px "SB Sans Display", Arial, sans-serif; }
.header-menu-banner span { display: inline-flex; margin-top: 12px; padding: 10px 24px; border-radius: 100px; color: #2d2e2e; background: #f4f4f4; font-size: 14px; line-height: 16px; font-weight: 600; }
.header-menu-banner:hover { color: #fff !important; }
.header-menu-banner:hover span { background: #fff; }
.header-menu-quick { display: flex; flex-wrap: wrap; gap: 16px 32px; margin-top: 24px; }
.is-compact .header-menu-grid { grid-template-columns: minmax(0,1fr); padding: 0; background: none; }
.is-compact .header-menu-card { min-height: 132px; padding-bottom: 70px; }
.is-compact .header-menu-card img { width: 64px; height: 64px; bottom: 12px; }
.is-compact .header-menu-banner { min-height: 320px; }
</style>
