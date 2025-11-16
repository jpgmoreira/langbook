<script lang="ts" setup>
  function keydown(e: KeyboardEvent) {
    // Allowed keyboard hotkeys:
    // - CTRL + c: Copy.
    // - CTRL + v: Paste.
    // - CTRL + z: Undo.
    // - CTRL + y: Redo.
    // - CTRL + b: Toggle bold.
    // - CTRL + i: Toggle italic.
    // - CTRL + u: Toggle underline.
    // - CTRL + a: Select all.
    // - CTRL + s: Toggle strikethrough.
    // - CTRL + <arrow_keys>: Jump whole words.
    // - CTRL + SHIFT + <arrow_keys>: Jump whole words selecting.
    const key = e.key.toLowerCase();
    if (e.ctrlKey) {
      switch (key) {
        case 'c':
        case 'v':
        case 'z':
        case 'y':
        case 'b':
        case 'i':
        case 'u':
        case 'a':
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          break;
        case 's':
          document.execCommand('strikeThrough');
          break;
        default:
          e.preventDefault();
      }
    } else {
      if (key === 'tab') {
        e.preventDefault();
        document.execCommand('insertText', false, ' '.repeat(8));
      }
    }
  }
</script>

<template>
  <div spellcheck="false" contenteditable="true" @keydown="keydown"></div>
</template>
