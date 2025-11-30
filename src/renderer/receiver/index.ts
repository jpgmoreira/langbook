import { Channels } from '@preload/channels';
import { router } from '@renderer/router';
import { APP_NAME } from '@common/constants';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { useUIStore } from '@renderer/store/ui';
import { EditorPageDTO } from '@common/dto/rendererResponseDTO';
import { RequestPageDTO } from '@common/dto/requestPageDTO';
import { Tags } from '@common/schemas/tags';

window.api.on(Channels.loadStartupData, async (data: StartupData) => {
  EventEmitter.instance.emit(Events.loadInitialData, data);
  document.documentElement.classList.add('theme-dark');
  if (!data.currProfile) {
    document.title = APP_NAME;
    return router.replace('/login');
  }
  document.title = `${data.currProfile.name}@${APP_NAME}`;
  await router.replace('/home');
  EventEmitter.instance.emit(Events.refreshCardsView, data.firstPage);
  EventEmitter.instance.emit(Events.refreshTags, data.tags);
  EventEmitter.instance.emit(Events.refreshHasSessions, Object.keys(data.sessions).length > 0);
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

window.api.on(Channels.refreshCardsView, (data: RequestPageDTO) => {
  EventEmitter.instance.emit(Events.refreshCardsView, data);
});

window.api.on(Channels.refreshTags, (tags: Tags) => {
  EventEmitter.instance.emit(Events.refreshTags, tags);
});

window.api.on(Channels.refreshHasSessions, (has: boolean) => {
  EventEmitter.instance.emit(Events.refreshHasSessions, has);
});
