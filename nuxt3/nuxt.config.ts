import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  vite: {
    resolve: {
      alias: {
        './runtimeConfig': './runtimeConfig.browser',
        process: require.resolve("rollup-plugin-node-polyfills"),
        events: require.resolve("rollup-plugin-node-polyfills"),
        stream: require.resolve("rollup-plugin-node-polyfills"),
        util: require.resolve("rollup-plugin-node-polyfills"),
        path: require.resolve("rollup-plugin-node-polyfills"),
        buffer: require.resolve("rollup-plugin-node-polyfills"),
        querystring: require.resolve("rollup-plugin-node-polyfills"),
        url: require.resolve("rollup-plugin-node-polyfills"),
        string_decoder: require.resolve("rollup-plugin-node-polyfills"),
        punycode: require.resolve("rollup-plugin-node-polyfills"),
        http: require.resolve("rollup-plugin-node-polyfills"),
        https: require.resolve("rollup-plugin-node-polyfills"),
        os: require.resolve("rollup-plugin-node-polyfills"),
        assert: require.resolve("rollup-plugin-node-polyfills"),
        constants: require.resolve("rollup-plugin-node-polyfills"),
        timers: require.resolve("rollup-plugin-node-polyfills"),
        console: require.resolve("rollup-plugin-node-polyfills"),
        vm: require.resolve("rollup-plugin-node-polyfills"),
        zlib: require.resolve("rollup-plugin-node-polyfills"),
        tty: require.resolve("rollup-plugin-node-polyfills"),
        domain: require.resolve("rollup-plugin-node-polyfills"),
        dns: require.resolve("rollup-plugin-node-polyfills"),
        dgram: require.resolve("rollup-plugin-node-polyfills"),
        child_process: require.resolve("rollup-plugin-node-polyfills"),
        cluster: require.resolve("rollup-plugin-node-polyfills"),
        module: require.resolve("rollup-plugin-node-polyfills"),
        net: require.resolve("rollup-plugin-node-polyfills"),
        readline: require.resolve("rollup-plugin-node-polyfills"),
        repl: require.resolve("rollup-plugin-node-polyfills"),
        tls: require.resolve("rollup-plugin-node-polyfills"),
        fs: require.resolve("rollup-plugin-node-polyfills"),
        crypto: require.resolve("rollup-plugin-node-polyfills"),
      }
    }
  },
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