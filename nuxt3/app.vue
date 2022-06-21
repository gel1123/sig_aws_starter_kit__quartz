<script setup lang="ts">
const is_logged_in = !!useCookie("is_logged_in").value;
</script>
<template>
  <div>
    <p class="p-10 w-full text-xl bg-orange-300">Hello World!</p>
    <NuxtPage v-if="is_logged_in" />
    <p v-else>should login</p>
  </div>
</template>