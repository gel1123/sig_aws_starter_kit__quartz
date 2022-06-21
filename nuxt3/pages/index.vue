<script setup lang="ts">

const fetchedData = ref<undefined | string>(undefined);

const onClick = async () => {
  console.log('clicked');
  const res = await useFetch('/api/echo', {
    method: 'POST',
    body: {
      message: 'Hello World'
    },
  });
  if (res.error.value) {
    console.error(res.error.value);
  }
  const data = res.data.value.body;
  console.log({data});
  fetchedData.value = data;
}
</script>
<template>
  <div>
    <Outline>
      <p>index</p>
      <button class="m-10 p-4 bg-slate-400 hover:opacity-70 w-3/5 rounded-lg shadow-md" @click="onClick()">fetch</button>
      <div class="bg-slate-300 text-gray-700 p-5">
        <p class="mb-2 text-gray-400">fetched data is ...</p>
        <pre>{{fetchedData}}</pre>
      </div>
    </Outline>
  </div>
</template>