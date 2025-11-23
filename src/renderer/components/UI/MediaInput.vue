<script lang="ts" setup>
  /**
   * "items" array must contain objects in the form:
   * {
   *      name: string,
   *      path: string,
   *      type: 'image' | 'audio'
   * }
   */
  type ElectronFile = File & {
    path: string;
  };
  export type FileRecord = {
    name: string;
    type: string;
    path: string;
  };
  const emit = defineEmits<{
    (e: 'add', files: FileRecord[]): void;
    (e: 'remove', item: FileRecord): void;
  }>();
  const props = withDefaults(defineProps<{ items: FileRecord[] }>(), { items: () => [] });
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
  function removeFile(item: FileRecord) {
    emit('remove', item);
  }
</script>

<template>
  <div class="media-input-root">
    <input
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
