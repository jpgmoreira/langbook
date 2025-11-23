<script lang="ts" setup>
  /**
   * "items" array must contain objects in the form:
   * {
   *      name: string,
   *      path: string,
   *      type: 'image' | 'audio'
   * }
   */
  import { type MediaFile } from '@common/schemas/card';
  import { useTemplateRef } from 'vue';
  type ElectronFile = File & {
    path: string;
  };
  defineExpose({
    triggerInput,
  });
  const emit = defineEmits<{
    (e: 'add', files: MediaFile[]): void;
    (e: 'remove', item: MediaFile): void;
  }>();
  const props = withDefaults(defineProps<{ items: MediaFile[] }>(), { items: () => [] });
  const inputRef = useTemplateRef('input-ref');
  function triggerInput() {
    inputRef.value?.click();
  }
  function addFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target || !target.files) return;
    const files = [...target.files].map((f) => {
      const file = f as ElectronFile;
      return { name: file.name, type: file.type, path: file.path };
    });
    target.value = ''; // Necessary. Comment this line and try to add a file, remove it, then add it again to see why.
    emit('add', files);
  }
  function removeFile(item: MediaFile) {
    emit('remove', item);
  }
</script>

<template>
  <div class="media-input-root">
    <input
      ref="input-ref"
      type="file"
      class="media-input"
      accept="image/*,audio/*"
      @change="addFiles"
      title=""
      multiple
    />
    <div class="media-item-parent">
      <span class="media-item" v-for="item in props.items" :key="item.name">
        <span class="media-name">{{ item.name }}</span>
        <button type="button" class="media-item-remove" @dblclick="removeFile(item)">
          ❌
          <div class="media-item-remove-tooltip">Double-click to remove</div>
        </button>
      </span>
    </div>
  </div>
</template>
