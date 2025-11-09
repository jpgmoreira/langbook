<script lang="ts" setup>
  import { computed, reactive, ref, useTemplateRef } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useUIStore } from '@renderer/store/ui';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import Modal from '@renderer/components/ui/Modal.vue';
  import { ProfileRecord } from '@common/schemas/profile';
  import { nextTick } from 'vue';
  import { useRouter } from 'vue-router';
  import { APP_NAME } from '@common/constants';
  const profileStore = useProfileStore();
  const uiStore = useUIStore();
  const router = useRouter();
  const records = computed(() => profileStore.registry.profileRecords);
  const selected = ref<ProfileRecord | null>(null);
  const isDeleting = ref(false);
  const names = reactive({
    create: '',
    rename: '',
  });
  const modals = reactive({
    create: false,
    rename: false,
    delete: false,
  });
  const createInput = useTemplateRef('create-input');
  const renameInput = useTemplateRef('rename-input');
  async function createProfile() {
    const name = names.create.trim();
    const result = await profileStore.createProfile(name);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    } else {
      modals.create = false;
      names.create = '';
      document.title = `${name}@${APP_NAME}`;
      router.replace('/home');
    }
  }
  async function deleteProfile() {
    const profileId = selected.value!.id;
    isDeleting.value = true;
    const result = await profileStore.deleteProfile(profileId);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    }
    isDeleting.value = false;
    modals.delete = false;
    selected.value = null;
  }
  function selectRow(record: ProfileRecord) {
    selected.value = record;
  }
  function startRename() {
    names.rename = selected.value?.name || '';
    modals.rename = true;
    nextTick(() => {
      renameInput.value?.focus();
      renameInput.value?.select();
    });
  }
  async function applyRename() {
    const profileId = selected.value!.id;
    const newName = names.rename;
    const result = await profileStore.renameProfile(profileId, newName);
    if (result.status === 'error') {
      uiStore.showToast(result.errorMsg, 'error');
    } else {
      modals.rename = false;
      names.rename = '';
    }
  }
  function openCreateModal() {
    modals.create = true;
    nextTick(() => createInput.value?.focus());
  }
  async function login() {
    const profileId = selected.value!.id;
    const name = selected.value!.name;
    await profileStore.login(profileId);
    document.title = `${name}@${APP_NAME}`;
    router.replace('/home');
  }
</script>

<template>
  <div class="flex flex-col h-screen login-page">
    <!-- Create modal: -->
    <Modal :visible="modals.create" @close="modals.create = false">
      <template #header>New Profile</template>
      <template #body>
        <div class="mb-1">Create a new profile:</div>
        <input
          type="text"
          ref="create-input"
          v-model.trim="names.create"
          placeholder="Profile Name..."
          @keydown.enter="createProfile"
        />
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
        <input
          type="text"
          ref="rename-input"
          v-model.trim="names.rename"
          :placeholder="selected?.name"
          @keydown.enter="applyRename"
        />
      </template>
      <template #footer>
        <div class="flex justify-between">
          <button type="button" class="btn-warning" @click="modals.rename = false">Cancel</button>
          <button type="button" class="btn-primary" @click="applyRename">Rename</button>
        </div>
      </template>
    </Modal>

    <!-- Delete modal: -->
    <Modal :visible="modals.delete" :frozen="isDeleting" @close="modals.delete = false">
      <template #header>Delete</template>
      <template #body>
        <div>
          Are you sure you want to delete profile
          <span class="text-danger font-bold">{{ selected?.name }}</span>
          ?
        </div>
        <div class="text-danger flex justify-center">This action cannot be undone!</div>
        <div v-if="isDeleting" class="text-danger flex items-center">
          <span class="loader mr-1"></span>
          Deleting...
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between">
          <button
            type="button"
            class="btn-warning"
            @click="modals.delete = false"
            :disabled="isDeleting"
          >
            Cancel
          </button>
          <button type="button" class="btn-danger" @click="deleteProfile" :disabled="isDeleting">
            Delete
          </button>
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
        <button type="button" class="btn-primary" @click="openCreateModal">Create</button>
        <button type="button" class="btn-primary" @click="login" :disabled="!selected">
          Select
        </button>
        <button type="button" class="btn-primary" :disabled="!selected" @click="startRename">
          Rename
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!selected"
          @click="modals.delete = true"
        >
          Delete
        </button>
      </div>
      <!-- TODO: About -->
      <button type="button" class="btn-primary absolute right-2">About</button>
    </footer>
  </div>
</template>
