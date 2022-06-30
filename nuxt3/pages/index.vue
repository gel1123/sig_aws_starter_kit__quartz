<script setup lang="ts">
import { resize } from '~~/usecase/imageUsecase';

const fetchedData = ref<undefined | string>(undefined);
const fetch = async () => {
  console.log('clicked');
  const res = await $fetch('/api/echo', {
    method: 'POST',
    body: {
      message: 'Hello World'
    },
  });
  fetchedData.value = JSON.stringify(res);
};

const resizedDataUrl = ref<null | string>(null);
const fileName = ref<null | string>(null);
const onChangeImage = async (e: Event) => {
  console.log("onChangeImage");
  const file = (e.target as HTMLInputElement | null)?.files?.[0];
  if (file) {
    console.log('file.name', file.name);
    fileName.value = file.name;
    const {
      resizedDataUrl: _resizedDataUrl
    } = await resize(file);

    resizedDataUrl.value = _resizedDataUrl;
  }
};


const itemID = "test";

const uploadImage = async () => {
  const dataUrl = resizedDataUrl.value;
  const result = await useFetch('/api/putImage', {
    method: "POST",
    body: {dataUrl, fileName: fileName.value, itemID},
  });
  if (result.error.value) {
    alert("通信に失敗しました。時間をおいて再度お試しください。")
  }
  console.log("result.data: ", result.data);
  alert("画像のアップロードが完了しました。");
  url.value = (await $fetch("/api/getItemRecord", {
    params: {itemID}
  })).Item.imagePath;
};

// GET なら RefとしてTemplateで使う前提の useFetch より、$fetchの方が良い。
// useFetch() は非同期Refであり、Ref.valueを介してテンプレート外で値を取得しようとすると、
// nullになってしまうケースがある。（非同期で値が変わるが、await で待つようなことはできない）。
// 
// 一方で $fetch は直接APIエンドポイントを叩くシンプルなAPI。
// https://v3.nuxtjs.org/guide/features/data-fetching#directly-calling-an-api-endpoint
const res = await $fetch("/api/getItemRecord", {
  params: {itemID}
});
console.log("res: ", res);

const url = ref<string | undefined>(res.Item.imagePath);

</script>
<template>
  <div>
    <Outline>
      <p>You have successfully logged in!</p>
      <button class="mt-5 mb-10 p-4 bg-slate-400 hover:opacity-70 w-full rounded-lg shadow-md" @click="fetch">
        fetch (POST)
      </button>
      <div class="bg-slate-300 text-gray-700 p-5">
        <p class="mb-2 text-gray-400">fetched data is ...</p>
        <pre class="whitespace-pre-wrap">{{fetchedData}}</pre>
      </div>
    </Outline>
    <Outline>
      <p>Put your image file to S3.</p>
      <div className="h-48 w-48 bg-gray-100 my-4">
        <img
          v-if="resizedDataUrl"
          :src="resizedDataUrl"
          width="192"
          height="192"
          alt="image"
          class="object-cover rounded-lg border-2 border-gray-300"
        />
      </div>
      <input
        @change="onChangeImage"
        accept="image/*"
        type="file"
        id="image"
        class="text-sm w-full py-2 border-b focus:outline-none focus:border-b-2 placeholder-gray-600 placeholder-opacity-50"
        placeholder="アイコン画像"
      />
      
      <button class="mt-5 mb-10 p-4 bg-slate-400 hover:opacity-70 w-full rounded-lg shadow-md" @click="uploadImage">
        Upload
      </button>

      <img :src="url" class="my-4" />
      <pre>{{data}}</pre>
    </Outline>
    <Outline>
      <p>If you want to log out, press the button below.</p>
      <a class="inline-block mt-5 mb-10 p-4 bg-slate-400 hover:opacity-70 w-full rounded-lg shadow-md"
        href="/logout">logout</a>
    </Outline>
  </div>
</template>