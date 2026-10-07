import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

const animationDir = fileURLToPath(new URL('./src/animation/', import.meta.url));
const sceneFiles = new Set([
  'components/ChipStory.vue', 'components/ChipMedia.vue',
  'composables/useScrollScene.js', 'composables/useChipMedia.js',
].map(path => fileURLToPath(new URL(`./src/${path}`, import.meta.url))));

// The running GSAP scene caches DOM nodes and exposed media methods. Replacing
// that subtree through Vue HMR leaves the scene writing to disposed instances.
// Reload this development page together; production playback is unaffected.
const reloadScrollScene = {
  name: 'reload-scroll-scene', apply: 'serve', enforce: 'pre',
  handleHotUpdate({ file, server }) {
    if (!file.startsWith(animationDir) && !sceneFiles.has(file)) return;
    server.ws.send({ type: 'full-reload' });
    return [];
  },
};

export default defineConfig({
  base: './',
  plugins: [reloadScrollScene, vue()],
  optimizeDeps: { entries: ['index.html', 'tests/*.html'] },
  server: {
    watch: { ignored: ['**/archive/**'] },
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/archive/**'] },
  },
});
