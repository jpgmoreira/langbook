<script lang="ts" setup>
  import { ref } from 'vue';

  const currentDropdown = ref('');
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-btn toolbar-undo"></div>
    <div class="toolbar-btn toolbar-redo"></div>
    <div class="toolbar-btn toolbar-bold"></div>
    <div class="toolbar-btn toolbar-italic"></div>
    <div class="toolbar-btn toolbar-underline"></div>
    <div class="toolbar-btn toolbar-strikeThrough"></div>
    <div class="toolbar-btn toolbar-superscript"></div>
    <div class="toolbar-btn toolbar-subscript"></div>
    <div class="toolbar-btn toolbar-clear"></div>
    <div class="toolbar-btn toolbar-resize">
      <div class="font-sizes toolbox" v-if="currentDropdown === 'resize'">
        <div v-for="i in 7" :key="i" @click="">
          {{ i }}
        </div>
      </div>
    </div>
    <div class="toolbar-btn toolbar-textcolor">
      <ColorPicker class="toolbox" @select="" v-if="currentDropdown === 'textcolor'" />
    </div>
    <div class="toolbar-btn toolbar-backgroundcolor">
      <ColorPicker class="toolbox" @select="" v-if="currentDropdown === 'backgroundcolor'" />
    </div>
  </div>
</template>

<style scoped>
  .toolbar {
    position: sticky;
    bottom: 0;
    display: inline-flex;
  }
</style>
