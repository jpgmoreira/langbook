import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/LoginPage.vue';
import SignupPage from '@renderer/pages/SignupPage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/signup',
    component: SignupPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
