<template>
  <div class="flex flex-col h-screen login-page" style="border: 1px solid blue">
    <div class="flex justify-center items-center h-10 text-lg">Select or create a profile</div>
    <div class="grow table-container"></div>
    <footer class="relative flex p-2">
      <div class="flex grow gap-1 justify-center">
        <button type="button" class="btn-primary">Create</button>
        <button type="button" class="btn-primary">Select</button>
        <button type="button" class="btn-primary">Rename</button>
        <button type="button" class="btn-primary">Delete</button>
      </div>
      <button type="button" class="btn-primary absolute right-2">About</button>
    </footer>
  </div>
</template>
