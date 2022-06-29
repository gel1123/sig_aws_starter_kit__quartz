<script setup lang="ts">
import nodeFetch from 'node-fetch';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { resize } from '~~/usecase/imageUsecase';
import { CognitoIdentityCredentialProvider, fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

const fetchedData = ref<undefined | string>(undefined);
const fetchEcho = async () => {
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

const uploadImage = async () => {
  const dataUrl = resizedDataUrl.value;

  if (!dataUrl || !fileName.value) {
    console.log("dataUrl is null");
    return;
  }

  //----------------------------------------------
  const config = useRuntimeConfig()
  const region = config.public.region;
  const Bucket = config.public.bucket;
  const itemID = "test";
  const Key = `items/${itemID}/${fileName}`;

  const blob = await (await (fetch || nodeFetch)(dataUrl)).blob();
  const file = new File([blob], fileName.value);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const credentialProvider: CognitoIdentityCredentialProvider = fromCognitoIdentityPool({
    identityPoolId: config.public.identityPoolId,
    logins: {
      "www.amazon.com": (await useCookie("id_token")).value,
    },
    clientConfig: {region},
  });

  const S3C = new S3Client({
    region, credentials: credentialProvider
  });
  
  let s3Result;
  try {
    console.log("try put item to s3")
    const _s3Result = await S3C.send(new PutObjectCommand({Bucket, Key, Body: buffer}));
    console.log("s3 result:", _s3Result);
    s3Result=_s3Result;
  } catch (e) {
    console.log("error:", e);
  }

  //----------------------------------------------

  const result = await useFetch('/api/putImage', {
    method: "POST",
    body: {dataUrl, fileName: fileName.value},
  });
  if (result.error.value) {
    alert("通信に失敗しました。時間をおいて再度お試しください。")
  }
  console.log("result.data: ", result.data);
  alert("画像のアップロードが完了しました。");
};

const config = useRuntimeConfig();
const url =  `${config.public.cloudFrontUrl}/items/test/item.imagefile`;

</script>
<template>
  <div>
    <Outline>
      <p>You have successfully logged in!</p>
      <button class="mt-5 mb-10 p-4 bg-slate-400 hover:opacity-70 w-full rounded-lg shadow-md" @click="fetchEcho">
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
    </Outline>
    <Outline>
      <p>If you want to log out, press the button below.</p>
      <a class="inline-block mt-5 mb-10 p-4 bg-slate-400 hover:opacity-70 w-full rounded-lg shadow-md"
        href="/logout">logout</a>
    </Outline>
  </div>
</template>