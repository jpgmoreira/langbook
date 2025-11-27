import { Channels } from '@preload/channels';
import { router } from '@renderer/router';
import { APP_NAME } from '@common/constants';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { useUIStore } from '@renderer/store/ui';
import { EditorPageDTO } from '@common/dto/editorPageDTO';

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

window.api.on(Channels.openEditor, async (data: EditorPageDTO) => {
  document.documentElement.classList.add('theme-dark');
  document.title = data.card ? 'Edit Card' : 'Add Card';
  await router.replace('/editor');
  EventEmitter.instance.emit(Events.loadEditorData, data);
});

window.api.on(Channels.closeEditor, () => {
  useUIStore().backdropVisible = false;
});
