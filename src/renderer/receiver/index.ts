import { Channels } from '@preload/channels';
import { router } from '@renderer/router';
import { APP_NAME } from '@common/constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { useUIStore } from '@renderer/store/ui';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';

window.api.on(Channels.startup, async (data: RendererResponseDTO) => {
  document.documentElement.classList.add('theme-dark');
  const title = data.profile ? `${data.profile.name}@${APP_NAME}` : APP_NAME;
  const route = data.profile ? '/home' : '/login';
  document.title = title;
  await router.replace(route);
  EventEmitter.instance.emit(Events.refreshData, data);
});

window.api.on(Channels.openEditor, async (data: RendererResponseDTO) => {
  document.documentElement.classList.add('theme-dark');
  document.title = data.card ? 'Edit Card' : 'Add Card';
  await router.replace('/editor');
  EventEmitter.instance.emit(Events.refreshData, data);
});

window.api.on(Channels.closeEditor, () => {
  useUIStore().backdropVisible = false;
});

window.api.on(Channels.refreshData, (data: RendererResponseDTO) => {
  EventEmitter.instance.emit(Events.refreshData, data);
});
