<script lang="ts" setup>
  import { useTemplateRef } from 'vue';
  import { stripHtml } from 'string-strip-html';

  const rteRef = useTemplateRef('rte');

  function focus() {
    rteRef.value?.focus();
  }

  function drop(e: DragEvent) {
    // Due to some problems and difficulties related to drop events in JavaScript, the only thing you are allowed to drop
    //   in a card's field are image files from your operating system.
    e.preventDefault();
    if (!e.dataTransfer) return;
    for (const item of e.dataTransfer.items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) return;
        console.log('-> drop an image from the operating system.');
        const reader = new FileReader();
        reader.onload = (fileEvent) => {
          focus();
          const result = fileEvent.target?.result;
          if (typeof result !== 'string') return;
          document.execCommand('insertImage', false, result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  function paste(e: ClipboardEvent) {
    e.preventDefault();
    if (!e.clipboardData) return;
    // 1. Check if pasting an image from the clipboard:
    const items = e.clipboardData.items;
    if (items && items.length && items[0].kind === 'file' && items[0].type.startsWith('image/')) {
      const file = items[0].getAsFile();
      if (!file) return;
      console.log('-> paste an image from the clipboard.');
      const reader = new FileReader();
      reader.onload = (fileEvent) => {
        const result = fileEvent.target?.result;
        if (typeof result !== 'string') return;
        document.execCommand('insertImage', false, result);
      };
      reader.readAsDataURL(file);
      return;
    }
    // 2. Check if pasting HTML content.
    // No HTML content other than images is allowed.
    // It's possible to paste HTML tags as plaintext, but if there is an image tag in the content, then other HTML tags will be stripped.
    const html = e.clipboardData.getData('text/html').trim();
    if (html && html.includes('<img ')) {
      console.log('-> paste as HTML.');
      const stripped = stripHtml(html, { ignoreTags: ['img'] }).result;
      setTimeout(() => {
        document.execCommand('insertHTML', false, stripped);
      }, 0);
      return;
    }
    // 3. Paste as plaintext:
    const text = e.clipboardData.getData('text/plain').trim();
    if (text) {
      console.log('-> paste as plaintext');
      setTimeout(() => {
        document.execCommand('insertText', false, text);
      }, 0);
    }
  }

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
  <div
    ref="rte"
    spellcheck="false"
    contenteditable="true"
    @keydown="keydown"
    @paste="paste"
    @drop="drop"
  ></div>
</template>
