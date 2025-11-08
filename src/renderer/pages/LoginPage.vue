<script lang="ts" setup>
  import { computed, reactive } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useUIStore } from '@renderer/store/ui';
  import Modal from '@renderer/components/ui/Modal.vue';
  const profileStore = useProfileStore();
  const uiStore = useUIStore();
  const records = computed(() => profileStore.registry.profileRecords);
  const names = reactive({
    create: '',
  });

  const modals = reactive({
    create: false,
  });
  async function createProfile() {
    const result = await profileStore.createProfile(names.create);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    } else {
      modals.create = false;
      // TODO: ... router!
    }
  }
</script>

<template>
  <div class="flex flex-col h-screen login-page" style="border: 1px solid red">
    <Modal :visible="modals.create" @close="modals.create = false">
      <template #header>New Profile</template>
      <template #body>
        <div class="mb-1">Create a new profile:</div>
        <input type="text" v-model.trim="names.create" placeholder="Profile Name..." />
      </template>
      <template #footer>
        <div class="flex justify-between">
          <button type="button" class="btn-warning" @click="modals.create = false">Cancel</button>
          <button type="button" class="btn-primary" @click="createProfile">Create</button>
        </div>
      </template>
    </Modal>

    <div class="flex justify-center items-center h-10 text-lg">Select or create a profile</div>
    <div class="flex grow table-container overflow-y-auto" style="border: 1px solid cyan">
      <div v-if="!records.length" class="flex grow items-center justify-center">
        <div class="text-xl opacity-70 whitespace-nowrap">No profiles yet!</div>
      </div>
      <div v-else class="grow">
        <table>
          <thead class="sticky top-0">
            <tr>
              <th>Profile</th>
              <th>#Sessions</th>
              <th>#Cards</th>
              <th>Created at</th>
              <th>Last access</th>
            </tr>
          </thead>
          <tbody>
            <!-- <tr v-for="profile in records">
              <td>{{ profile.name }}</td>
              <td>{{ profile.sessions }}</td>
              <td>{{ profile.cards }}</td>
              <td>{{ profile.createdAt }}</td>
              <td>{{ profile.lastAccess }}</td>
            </tr> -->
            <tr v-for="i in 100">
              <td>{{ i }}</td>
              <td>{{ i }}</td>
              <td>{{ i }}</td>
              <td>{{ i }}</td>
              <td>{{ i }}</td>
            </tr>
          </tbody>
        </table>
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
