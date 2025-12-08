import { createMemoryHistory, createRouter } from 'vue-router';
import LoginPage from '@renderer/pages/LoginPage.vue';
import HomePage from '@renderer/pages/HomePage.vue';
import EditorPage from '@renderer/pages/EditorPage.vue';
import Flashcards from '@renderer/pages/Flashcards.vue';
import GraphPage from '@renderer/pages/GraphPage.vue';

const routes = [
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/home',
    component: HomePage,
  },
  {
    path: '/editor',
    component: EditorPage,
  },
  {
    path: '/flashcards',
    component: Flashcards,
  },
  {
    path: '/graph',
    component: GraphPage,
  },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
