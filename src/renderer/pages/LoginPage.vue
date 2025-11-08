<script lang="ts" setup>
  import { computed, reactive } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import Modal from '@renderer/components/ui/Modal.vue';
  const store = useProfileStore();
  const records = computed(() => store.registry.profileRecords);
  const modals = reactive({
    create: false,
  });
</script>

<template>
  <div class="flex flex-col h-screen login-page">
    <Modal :visible="modals.create" @close="modals.create = false">
      <template #header>New Profile</template>
      <template #body>Create a new profile</template>
      <template #footer></template>
    </Modal>

    <div class="flex justify-center items-center h-10 text-lg">Select or create a profile</div>
    <div class="flex grow table-container">
      <div v-if="!records.length" class="flex grow items-center justify-center">
        <div class="text-xl opacity-70 whitespace-nowrap">No profiles yet!</div>
      </div>
    </div>
    <footer class="relative flex p-2">
      <div class="flex grow gap-1 justify-center">
        <button type="button" class="btn-primary" @click="modals.create = true">Create</button>
        <button type="button" class="btn-primary">Select</button>
        <button type="button" class="btn-primary">Rename</button>
        <button type="button" class="btn-primary">Delete</button>
      </div>
      <button type="button" class="btn-primary absolute right-2">About</button>
    </footer>
  </div>
</template>
