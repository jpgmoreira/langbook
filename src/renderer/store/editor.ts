import { EditorPageDTO, getEmptyEditorPageDTO } from '@common/dto/editorPageDTO';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { defineStore } from 'pinia';

EventEmitter.instance.on(Events.loadEditorData, (data: EditorPageDTO) => {
  useEditorStore().initFromStartupData(data);
});

export const useEditorStore = defineStore('editor', {
  state: () => ({
    data: getEmptyEditorPageDTO(),
  }),
  actions: {
    initFromStartupData(data: EditorPageDTO) {
      this.data = data;
    },
  },
});
