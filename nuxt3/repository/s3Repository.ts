import { S3Client } from '@aws-sdk/client-s3';
import { CognitoIdentityCredentialProvider, fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

let memo = {} as { client?: S3Client};

export const getS3Client = ({region, frontEndOption}: {
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
  const credentials = (() => {
    if (!frontEndOption) return undefined;
    const {identityPoolId, idToken} = frontEndOption;
    const credentialProvider: CognitoIdentityCredentialProvider = fromCognitoIdentityPool({
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
  memo.client = s3Client;
  return s3Client;
};
