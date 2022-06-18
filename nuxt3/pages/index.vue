<script setup lang="ts">
definePageMeta({middleware: ['auth']});
const onClick = () => {
  console.log('clicked');
  useFetch('/api/echo', {
    method: 'POST',
    body: {
      message: 'Hello World'
    }
  }).then(res => {
    console.log(res);
  });
}
</script>
<template>
  <div>
    <Outline>
      <p>index</p>
      <button class="m-10 p-4" @click="onClick()">fetch</button>
    </Outline>
  </div>
</template>