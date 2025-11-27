import { createApp } from 'vue';
import { router } from './router';
import { createPinia } from 'pinia';
import FloatingVue from 'floating-vue';
import App from './App.vue';
import 'floating-vue/dist/style.css';
import './receiver';

const app = createApp(App);
app.use(router);
app.use(FloatingVue);
app.use(createPinia());
app.mount('#app');
