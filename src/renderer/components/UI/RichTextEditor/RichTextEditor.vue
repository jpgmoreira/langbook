<script lang="ts" setup>
  import { stripHtml } from 'string-strip-html';

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
  <div spellcheck="false" contenteditable="true" @keydown="keydown" @paste="paste"></div>
</template>
