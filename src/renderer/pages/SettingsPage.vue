<script setup lang="ts">
  import { ref } from 'vue';
  import Header from '@renderer/components/Header.vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { APP_NAME, APP_VERSION, APP_HOMEPAGE } from '@common/constants';
  import { useUIStore } from '@renderer/store/ui';
  import { useRouter } from 'vue-router';
  import { Events } from '@renderer/events/events';
  const router = useRouter();
  const uiStore = useUIStore();
  const profileStore = useProfileStore();
  const reviewProb = ref(profileStore.currProfile!.reviewProbability * 100);
  const suspendedProb = ref(profileStore.currProfile!.suspendedProbability * 100);
  async function copyHomepage() {
    try {
      await navigator.clipboard.writeText(APP_HOMEPAGE);
      uiStore.showToast('URL copied!', 'success');
    } catch (err) {
      uiStore.showToast('Failed to copy URL', 'error');
    }
  }
  async function updateProbs() {
    try {
      await profileStore.updateFlashcardsProbabilities(
        reviewProb.value / 100,
        suspendedProb.value / 100
      );
      uiStore.showToast('Probabilities updated!', 'success', 1000);
    } catch {
      uiStore.showToast('Failed to update probabilities!', 'error', 1000);
    }
  }
  function resetProbs() {
    reviewProb.value = 30;
    suspendedProb.value = 0;
    updateProbs();
  }
  async function logout() {
    const data = await profileStore.logout();
    EventEmitter.instance.emit(Events.clearProfileData);
    EventEmitter.instance.emit(Events.refreshData, data);
    document.title = APP_NAME;
    await router.replace('/login');
  }
</script>

<template>
  <div v-if="profileStore.currProfile" class="settings-page w-[100vw] h-[100vh] flex flex-col">
    <Header />
    <div class="p-8">
      <div>
        <div class="section-title">Flashcards probabilities:</div>

        <div class="w-fit">
          <div class="input-row">
            <label for="review-prob" class="whitespace-nowrap">Review (%):</label>
            <input id="review-prob" type="number" v-model="reviewProb" />
          </div>

          <div class="input-row">
            <label for="suspended-prob">Suspended (%):</label>
            <input id="suspended-prob" type="number" v-model="suspendedProb" />
          </div>
        </div>

        <div v-if="reviewProb + suspendedProb > 100" class="text-danger">
          The sum of the probabilities should be less than or equal 100%.
        </div>

        <div class="button-row">
          <button type="button" class="btn-primary" @click="updateProbs">Save</button>
          <button type="button" class="btn-primary" @click="resetProbs">Reset</button>
        </div>
      </div>

      <hr />

      <div>
        <div class="section-title">Profile</div>

        <div class="profile-box">
          <div>
            Name:
            <span class="font-bold">{{ profileStore.currProfile!.name }}</span>
          </div>
          <button type="button" class="btn-warning" @click="logout">Logout</button>
        </div>
      </div>

      <hr />

      <div>
        <div class="section-title">App</div>

        <div class="app-info">
          <div>{{ APP_NAME }} – Version {{ APP_VERSION }}</div>
          <div>
            Homepage:
            <a href="#" @click="copyHomepage">{{ APP_HOMEPAGE }}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
