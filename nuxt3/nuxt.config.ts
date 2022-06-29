import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  nitro: {
      preset: 'aws-lambda' // Nuxt3をLambdaとしてビルドする設定
  },
  typescript: {
      strict: true
  },
  runtimeConfig: {

    // ストア関連
    dataTable: process.env.DYNAMO_DATA_TABLE,
    sessionTable: process.env.DYNAMO_SESSION_TABLE,
    
    // Cognito関連
    clientId: process.env.COGNITO_CLIENT_ID,
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientSecret: process.env.COGNITO_CLIENT_SECRET,
    tokenEndpoint: process.env.COGNITO_TOKEN_ENDPOINT,
    loginEndpoint: process.env.COGNITO_LOGIN_ENDPOINT,
    logoutEndpoint: process.env.COGNITO_LOGOUT_ENDPOINT,
    redirectUrl: process.env.COGNITO_REDIRECT_URL,

    public: {
      isDev: process.env.NODE_ENV === 'development',

      // S3を認証済みフロントエンドから操作するためのconfig
      region: process.env.AWS_REGION,
      bucket: process.env.S3_DATA_BUCKET,
      identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,

      // CloudFront（AWS環境上ではリダイレクトURLと同一だが、ローカルでは異なる）
      cloudFrontUrl: process.env.CLOUD_FRONT_URL ?
        process.env.CLOUD_FRONT_URL
        : process.env.COGNITO_REDIRECT_URL
    },
  },
  ssr: true, // ビルドモードの指定。trueなら SSR or SSG. falseなら SPA. デフォルトでtrue.
  target: 'server', // ビルドモードの指定。'server'なら SSR. 'static'なら SSG or SPA. デフォルトで 'server'.
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