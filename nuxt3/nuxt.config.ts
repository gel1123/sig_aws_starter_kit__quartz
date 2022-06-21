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
    isDev: process.env.NODE_ENV === 'development',
    region: process.env.AWS_REGION,
    dataTable: process.env.DATA_TABLE,
    sessionTable: process.env.SESSION_TABLE,

    // Cognito関連
    clientId: process.env.CLIENT_ID,
    userPoolId: process.env.USER_POOL_ID,
    clientSecret: process.env.CLIENT_SECRET,
    tokenEndpoint: process.env.TOKEN_ENDPOINT,
    loginEndpoint: process.env.LOGIN_ENDPOINT,
    logoutEndpoint: process.env.LOGOUT_ENDPOINT,
    redirectUrl: process.env.REDIRECT_URL,
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