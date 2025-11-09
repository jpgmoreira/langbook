<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import Header from '@renderer/components/Header.vue';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  const isResizing = ref(false);
  const treeAreaWidth = ref(300);
  const contestsAreaWidth = ref(window.innerWidth - 300);
  function windowMouseUp() {
    isResizing.value = false;
  }
  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    treeAreaWidth.value = e.clientX;
    contestsAreaWidth.value = window.innerWidth - e.clientX;
    window.getSelection()?.removeAllRanges();
  }
  onMounted(() => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div
    class="main-container h-screen flex flex-col"
    :class="{ resizing: isResizing }"
    style="border: 1px solid red"
  >
    <Header />
    <div class="flex grow" style="border: 1px solid cyan">
      <div :style="{ width: `${treeAreaWidth}px` }">
        <TreeView
          class="select-none"
          files-hint
          search
          file-icon
          style="border: 1px solid olivedrab"
        />
      </div>
      <div
        class="separator shrink-0"
        :class="{ resizing: isResizing }"
        @mousedown="isResizing = true"
      ></div>
      <div
        class="flex grow"
        :style="{ width: `${contestsAreaWidth}px` }"
        style="border: 1px solid tomato"
      ></div>
    </div>
  </div>
</template>

<style scoped>
  .main-container.resizing {
    cursor: ew-resize;
  }
  .separator {
    width: 5px;
    background: gray;
  }
  .separator:hover,
  .separator.resizing {
    background: #0087e7;
    cursor: ew-resize;
  }
</style>
