import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/LoginPage.vue';
import HomePage from '@renderer/pages/HomePage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/home',
    component: HomePage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
