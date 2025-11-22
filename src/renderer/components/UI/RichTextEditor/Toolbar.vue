<script lang="ts" setup>
  import { ref } from 'vue';

  const emit = defineEmits<{
    (e: 'undo'): void;
    (e: 'redo'): void;
    (e: 'bold'): void;
    (e: 'italic'): void;
    (e: 'underline'): void;
    (e: 'strikeThrough'): void;
    (e: 'superscript'): void;
    (e: 'subscript'): void;
    (e: 'clear'): void;
  }>();

  const currentDropdown = ref('');
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-btn toolbar-undo" @mousedown.prevent="emit('undo')"></div>
    <div class="toolbar-btn toolbar-redo" @mousedown.prevent="emit('redo')"></div>
    <div class="toolbar-btn toolbar-bold" @mousedown.prevent="emit('bold')"></div>
    <div class="toolbar-btn toolbar-italic" @mousedown.prevent="emit('italic')"></div>
    <div class="toolbar-btn toolbar-underline" @mousedown.prevent="emit('underline')"></div>
    <div class="toolbar-btn toolbar-strikeThrough" @mousedown.prevent="emit('strikeThrough')"></div>
    <div class="toolbar-btn toolbar-superscript" @mousedown.prevent="emit('superscript')"></div>
    <div class="toolbar-btn toolbar-subscript" @mousedown.prevent="emit('subscript')"></div>
    <div class="toolbar-btn toolbar-clear" @mousedown.prevent="emit('clear')"></div>
    <div class="toolbar-btn toolbar-resize">
      <div class="font-sizes toolbox" v-if="currentDropdown === 'resize'">
        <div v-for="i in 7" :key="i" @click="">
          {{ i }}
        </div>
      </div>
    </div>
    <div class="toolbar-btn toolbar-textcolor">
      <!-- <ColorPicker class="toolbox" @select="" v-if="currentDropdown === 'textcolor'" /> -->
    </div>
    <div class="toolbar-btn toolbar-backgroundcolor">
      <!-- <ColorPicker class="toolbox" @select="" v-if="currentDropdown === 'backgroundcolor'" /> -->
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
