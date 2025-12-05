<script lang="ts" setup>
  import { Card } from '@common/schemas/card';
  import Modal from './Modal.vue';
  const props = defineProps<{
    card: Card | null;
    visible: boolean;
    isDeleting: boolean;
  }>();
  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'delete'): void;
    (e: 'animationFinished'): void;
  }>();
</script>

<template>
  <Modal
    :visible="props.visible"
    :frozen="props.isDeleting"
    @close="emit('close')"
    @animation-finished="emit('animationFinished')"
  >
    <template #header>Delete card</template>
    <template #body>
      <div class="flex flex-col text-center">
        <span>Are you sure you want to delete this card?</span>
        <span class="text-danger my-2">This action cannot be undone!</span>
        <div v-if="props.isDeleting" class="text-danger flex items-center">
          <span class="loader mr-2"></span>
          Deleting...
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between">
        <button
          type="button"
          class="btn-secondary"
          :disabled="props.isDeleting"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn-danger"
          :disabled="props.isDeleting"
          @click="emit('delete')"
        >
          Delete
        </button>
      </div>
    </template>
  </Modal>
</template>
