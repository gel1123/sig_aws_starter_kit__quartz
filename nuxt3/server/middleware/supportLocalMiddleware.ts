
// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {

  // npm run dev で localhost での起動をおこなっている場合のみ有効
  const config = useRuntimeConfig();
  if (!config.isDev || !event.req.url?.startsWith("/items/")) return;

  // CDKでの CloudFrontの設定と同様に「/items/」は S3バケットアクセスとみなし、
  // CloudFrontのオリジンを付与する
  // （Lambda上ではこの処理は不要であり、到達しない）
  const redirectUrl = `${config.cloudFrontUrl}${event.req.url}`;
  console.log("redirectUrl", redirectUrl);
  event.res.writeHead(302, {
    Location: redirectUrl,
  });
  event.res.end();

  /**
   * ## 補足：
   * 一見すると、フロントエンドで useRuntimeConfig().public から取得すればいいだけの話に見えるが、
   * 実際には、Lambdaビルド構成時には、 npm run build で 下記のエラーが生じてしまう。
   * 
   * ```
   * "[unhandledRejection] Cannot read properties of null (reading 'config')"
   * ```
   * 
   * これを回避するには、2022年6月末時点では、RuntimeConfig に public な値を設定しない＆使わない必要がある。
   * その場合に問題となる「localhostとS3とのオリジン差異（正確にはS3にアクセスするためのCloudFrontオリジン）」を解消するために、
   * このミドルウェアを実装した。
   */
});