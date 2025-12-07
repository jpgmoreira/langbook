import { defineStore } from 'pinia';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { RefreshPlace } from '@common/types/refreshPlace';

EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => {
  if (data.where.includes(RefreshPlace.MEDIA_STORE)) {
    useMediaStore().refreshData(data);
  }
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useMediaStore().clear();
});

export const useMediaStore = defineStore('media', {
  state: () => ({
    mediaDir: '',
  }),
  actions: {
    refreshData(data: RendererResponseDTO) {
      this.mediaDir = data.mediaDir!;
    },
    clear() {
      this.mediaDir = '';
    },
    resolveMediaPath(mediaPath: string) {
      return `safe-file://${this.mediaDir}/${mediaPath}`;
    },
    processRteImages(html: string) {
      if (!html) return html;
      const div = document.createElement('div');
      div.innerHTML = html;
      const imgs = div.querySelectorAll('img');
      imgs.forEach((img) => {
        const src = img.getAttribute('src');
        if (!src) return;
        const isSafeFile = src.startsWith('safe-file');
        const isBase64 = src.startsWith('data:image');
        const isUrl = src.startsWith('http');
        if (isSafeFile || isBase64 || isUrl) return;
        try {
          const resolved = this.resolveMediaPath(src);
          img.setAttribute('src', resolved);
        } catch (e) {
          console.warn('Error processing image src:', e);
        }
      });
      return div.innerHTML;
    },
  },
});
