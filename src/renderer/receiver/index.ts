import { Channels } from '@preload/channels';
import { router } from '@renderer/router';
import { APP_NAME } from '@common/constants';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';

window.api.on(Channels.loadStartupData, (data: StartupData) => {
  EventEmitter.instance.emit(Events.loadInitialData, data);
  document.documentElement.classList.add('theme-dark');
  if (!data.currProfile) {
    document.title = APP_NAME;
    return router.replace('/login');
  }
  document.title = `${data.currProfile.name}@${APP_NAME}`;
  return router.replace('/home');
});

window.api.on(Channels.openEditor, (card: null) => {
  document.documentElement.classList.add('theme-dark');
  document.title = card ? 'Edit Card' : 'Add Card';
  router.replace('/editor');
});
