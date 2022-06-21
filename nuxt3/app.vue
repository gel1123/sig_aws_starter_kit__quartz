<script setup lang="ts">
const loading = ref(true);
const is_logged_in = ref(false);
onMounted(() => {
  is_logged_in.value = !!useCookie("is_logged_in").value;
  loading.value = false;
});
</script>
<template>
  <div v-if="!loading">
    <p class="p-10 w-full text-xl bg-orange-300">Hello World!</p>
    <NuxtPage v-if="is_logged_in"/>
    <div v-else class="my-10 w-full text-center">
      <a class="inline-block p-4 bg-slate-400 hover:opacity-70 w-3/5 rounded-lg shadow-md" href="/login">Login</a>
    </div>
  </div>
</template>