import { Channels } from '@preload/channels';
import { router } from '@renderer/router';
import { APP_NAME } from '@common/constants';

window.api.on(Channels.loadStartupData, () => {
  document.documentElement.classList.add('theme-dark');
  document.title = APP_NAME;
  return router.replace('/login');
});
