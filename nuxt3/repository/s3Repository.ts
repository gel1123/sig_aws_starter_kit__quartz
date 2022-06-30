import { Credentials } from '@aws-sdk/client-cognito-identity';
import { S3Client } from '@aws-sdk/client-s3';

// ________________________________
// 
// パッケージ「@aws-sdk/credential-providers」は、
// No matching export in "browser-external:http" for import "request"
// というエラーがローカル環境で発生するケースがある。
// これは Vite が NodeJS ライブラリを単独でラップしないがためにコアライブラリをブラウザで使用できない
// ことが起因のエラーであり、対処が困難（一応可能ではあるらしいが今後のメンテに差し支える可能性がある）なので、
// credential-providers ではなく、 client-cognito-identity で都度 GetId, GetCredentialsForIdentity
// を行う方針とした。
//
// 参考：
//  - https://stackoverflow.com/questions/70060570/vitesse-vue3-issue-adding-libraries
//  - https://github.com/ionic-team/rollup-plugin-node-polyfills
// import { CognitoIdentityCredentialProvider, fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

let memo = {} as { client?: S3Client};

export const getS3Client = ({region, cognitoCredentials}: {
  region: string,
  cognitoCredentials?: Credentials
}) => {
  // Cognito ID Pools から「一時的な認証情報」を得ているなら、Clientを再生成する（なのでメモをリセットする）。
  if (cognitoCredentials) memo = {};
  // 上記以外で前回のClientがあればそれを使う。
  if (memo.client) return memo.client;

  const s3Credentials = 
    cognitoCredentials && cognitoCredentials.AccessKeyId && cognitoCredentials.SecretKey ?
    {
      accessKeyId: cognitoCredentials.AccessKeyId,
      secretAccessKey: cognitoCredentials.SecretKey,
      sessionToken: cognitoCredentials.SessionToken,
      expiration: cognitoCredentials.Expiration
    } : undefined;

  const s3Client = new S3Client({
    region, credentials: s3Credentials
  });
  memo.client = s3Client;
  return s3Client;
};
