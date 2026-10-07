import { createApp } from 'vue';
import App from './App.vue';
import 'lenis/dist/lenis.css';
import './styles/reference.css';
import './styles/accessibility.css';

// This is the client entry; App and its imports also support server rendering.
createApp(App).mount('#app');
