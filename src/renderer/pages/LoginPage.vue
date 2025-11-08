<script lang="ts" setup>
  import { computed, reactive, ref } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useUIStore } from '@renderer/store/ui';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import Modal from '@renderer/components/ui/Modal.vue';
  import { ProfileRecord } from '@common/schemas/profile';
  const profileStore = useProfileStore();
  const uiStore = useUIStore();
  const records = computed(() => profileStore.registry.profileRecords);
  const selected = ref<ProfileRecord | null>(null);
  const names = reactive({
    create: '',
    rename: '',
  });
  const modals = reactive({
    create: false,
    rename: false,
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
  function selectRow(record: ProfileRecord) {
    selected.value = record;
  }
  function startRename() {
    names.rename = selected.value?.name || '';
    modals.rename = true;
  }
  async function applyRename() {
    const profileId = selected.value!.id;
    const newName = names.rename;
    const result = await profileStore.renameProfile(profileId, newName);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    } else {
      modals.rename = false;
    }
  }
</script>

<template>
  <div class="flex flex-col h-screen login-page">
    <!-- Create modal: -->
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

    <!-- Rename modal: -->
    <Modal :visible="modals.rename" @close="modals.rename = false">
      <template #header>Rename</template>
      <template #body>
        <div class="mb-1">Rename the "{{ selected?.name }}" profile:</div>
        <input type="text" v-model.trim="names.rename" :placeholder="selected?.name" />
      </template>
      <template #footer>
        <div class="flex justify-between">
          <button type="button" class="btn-warning" @click="modals.rename = false">Cancel</button>
          <button type="button" class="btn-primary" @click="applyRename">Rename</button>
        </div>
      </template>
    </Modal>

    <div class="flex justify-center items-center h-10 text-lg">Select or create a profile</div>
    <div class="flex grow table-container overflow-y-auto">
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
            <tr
              v-for="profile in records"
              class="cursor-pointer"
              :class="{ selected: profile === selected }"
              @click="selectRow(profile)"
            >
              <td>{{ profile.name }}</td>
              <td>{{ profile.sessions }}</td>
              <td>{{ profile.cards }}</td>
              <td>{{ parseTimestamp(profile.createdAt) }}</td>
              <td>{{ parseTimestamp(profile.lastAccess) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <footer class="relative flex p-2">
      <div class="flex grow gap-1 justify-center">
        <button type="button" class="btn-primary" @click="modals.create = true">Create</button>
        <button type="button" class="btn-primary" :disabled="!selected">Select</button>
        <button type="button" class="btn-primary" :disabled="!selected" @click="startRename">
          Rename
        </button>
        <button type="button" class="btn-primary" :disabled="!selected">Delete</button>
      </div>
      <button type="button" class="btn-primary absolute right-2">About</button>
    </footer>
  </div>
</template>
