<script lang="ts" setup>
  import { ref, reactive, useTemplateRef } from 'vue';
  import { stripHtml } from 'string-strip-html';

  // --- Variables: ---

  const rteRef = useTemplateRef('rte');
  const isCtxVisible = ref(false);
  const ctxStyle = reactive({
    left: '',
    right: '',
    top: '',
    bottom: '',
  });

  // --- Functions: ---

  function focus() {
    rteRef.value?.focus();
  }

  function openCtx(e: MouseEvent) {
    const rte = rteRef.value;
    if (!rte) return;
    const rect = rte.getBoundingClientRect();
    const rl = rect.left,
      rr = rect.right,
      rt = rect.top,
      rb = rect.bottom,
      cx = e.clientX,
      cy = e.clientY;
    const ctxWidth = 100,
      ctxHeight = 100;
    Object.assign(ctxStyle, {
      left: '',
      right: '',
      top: '',
      bottom: '',
    });
    if (rb - cy < ctxHeight) {
      ctxStyle.bottom = rb - cy + 'px';
    } else {
      ctxStyle.top = cy - rt + 'px';
    }
    if (rr - cx < ctxWidth) {
      ctxStyle.right = rr - cx + 'px';
    } else {
      ctxStyle.left = cx - rl + 'px';
    }
    isCtxVisible.value = true;
  }

  // --- Context menu interactions: ---

  function contextMenuCopy() {
    document.execCommand('copy');
    isCtxVisible.value = false;
  }
  function contextMenuPaste() {
    /// Fix here.
    isCtxVisible.value = false;
  }
  function contextMenuCut() {
    document.execCommand('cut');
    isCtxVisible.value = false;
  }

  // --- Drop: ---

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

  // --- Paste: ---

  function paste(e: ClipboardEvent) {
    e.preventDefault();
    const data = e.clipboardData;
    if (!data) return;
    handlePaste(data);
  }

  function handlePaste(data: DataTransfer) {
    // 1. Check if pasting an image from the clipboard:
    const items = data.items;
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
    // FIX: Allow pasting of content that comes from inside the RTE, including styles and images.
    const html = data.getData('text/html').trim();
    if (html) {
      const cleaned = cleanPastedHTML(html);
      setTimeout(() => {
        document.execCommand('insertHTML', false, cleaned);
      }, 0);
      return;
    }
    // 3. Paste as plaintext:
    const text = data.getData('text/plain').trim();
    if (text) {
      console.log('-> paste as plaintext');
      setTimeout(() => {
        document.execCommand('insertText', false, text);
      }, 0);
    }
  }

  function cleanPastedHTML(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    sanitizeNode(doc.body);
    return doc.body.innerHTML;
  }

  function sanitizeNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      el.removeAttribute('style');
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name !== 'src' && name !== 'href' && name !== 'alt') {
          el.removeAttribute(name);
        }
      });
      if (el.tagName === 'IMG') {
        try {
          const url = new URL((el as HTMLImageElement).src);
          if (url.protocol.startsWith('http')) {
            el.remove();
            return;
          }
        } catch {
          el.remove();
          return;
        }
      }
    }
    node.childNodes.forEach(sanitizeNode);
  }

  // --- Keydown: ---

  function keydown(e: KeyboardEvent) {
    // Allowed keyboard hotkeys:
    // - CTRL + c: Copy.
    // - CTRL + v: Paste.
    // - CTRL + x: Cut.
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
        case 'x':
          document.execCommand('cut');
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
  <div class="rte-root">
    <div v-if="isCtxVisible" :style="ctxStyle" class="context-menu">
      <div @mousedown.prevent="contextMenuCut">Cut</div>
      <div @mousedown.prevent="contextMenuCopy">Copy</div>
      <div @mousedown.prevent="contextMenuPaste">Paste</div>
    </div>
    <div
      ref="rte"
      spellcheck="false"
      contenteditable="true"
      @keydown="keydown"
      @mousedown.right.prevent="openCtx"
      @mousedown.left="isCtxVisible = false"
      @wheel="isCtxVisible = false"
      @paste="paste"
      @drop="drop"
    ></div>
  </div>
</template>

<style scoped>
  .rte-root {
    position: relative;
  }
  .context-menu {
    position: absolute;
  }
</style>
