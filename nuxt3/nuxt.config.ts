import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  nitro: {
      preset: 'aws-lambda' //<= Nuxt3をLambdaアプリケーションとして構成する設定
  },
  typescript: {
      strict: true
  },
  privateRuntimeConfig: {
      threadsTableName: process.env.THREADS_TABLE_NAME,
      region: process.env.REGION,
      mode: process.env.MODE,
      bucket: process.env.BUCKET,
      domain: process.env.DOMAIN
  },
  ssr: true, //<= ビルドモードの指定。trueなら SSR or SSG. falseなら SPA. デフォルトでtrue.
  target: 'server', //<= ビルドモードの指定。'server'なら SSR. 'static'なら SSG or SPA. デフォルトで 'server'.
  css: [
    '@/assets/css/main.css',
  ],
  build: {
    postcss: {
      postcssOptions: {
        plugins: {
          tailwindcss: {},
          autoprefixer: {},
        },
      },
    },
  },

})