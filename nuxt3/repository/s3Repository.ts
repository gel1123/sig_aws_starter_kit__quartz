import { S3Client } from '@aws-sdk/client-s3';

// // import nodePolyfills from 'rollup-plugin-node-polyfills';
// // nodePolyfills();

// @ts-ignore
// var global = global || window; var Buffer = Buffer || []; var process = process || { env: { DEBUG: undefined }, version: [] };

// No matching export in "browser-external:http" for import "request"
// というエラーがローカル環境で発生するケースがある。
// これは Vite が NodeJS ライブラリを単独でラップしないがためにコアライブラリをブラウザで使用できない
// ことが起因のエラーであり、
// その対処として、 `rollup-plugin-node-polyfills` をプロジェクトに導入している。
// 参考：
//  - https://stackoverflow.com/questions/70060570/vitesse-vue3-issue-adding-libraries
//  - https://github.com/ionic-team/rollup-plugin-node-polyfills
// import { CognitoIdentityCredentialProvider, fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

let memo = {} as { client?: S3Client};

export const getS3Client = async ({region, frontEndOption}: {
  region: string,
  frontEndOption?: {
    identityPoolId: string,
    idToken: string,
  }
}) => {
  if (memo.client) return memo.client;

  /**
   * Cognito ID Pools からクレデンシャルを取得する。
   * なお、これはS3書き込みをフロントエンドで行うためのロール取得処理であって、
   * バックエンドでは不要である（Lambdaに割り当てたロールがあるため）。
   */
  const credentials = await (async () => {
    if (!frontEndOption) return undefined;
    const {identityPoolId, idToken} = frontEndOption;
    const { fromCognitoIdentityPool } = await import('@aws-sdk/credential-providers');
    const credentialProvider = fromCognitoIdentityPool({
      identityPoolId: identityPoolId,
      logins: {
        "www.amazon.com": idToken,
      },
      clientConfig: {region: region},
    });
    return credentialProvider;
  })()

  const s3Client = new S3Client({
    region, credentials
  });

  // const s3Client = new S3Client({
  //   region
  // });
  memo.client = s3Client;
  return s3Client;
};
