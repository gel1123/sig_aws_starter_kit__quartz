import { CognitoIdentityClient, GetCredentialsForIdentityCommand, GetIdCommand } from "@aws-sdk/client-cognito-identity";

/**
 * Cognito ID Pools から「一時的な認証情報」を取得する
 */
export const getCredentials = async (id_token: string) => {
  const config = useRuntimeConfig();
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/getidcommand.html
  const client = new CognitoIdentityClient({region: config.public.region});
  const providerName = `cognito-${config.public.region}.amazonaws.com/${config.public.userPoolId}`;
  const Logins: {[providerName: string]: string} = {};
  Logins[providerName] = id_token;
  const getIdCommand = new GetIdCommand({
    IdentityPoolId: config.public.identityPoolId, Logins
  });
  const getIdResponse = await client.send(getIdCommand);
  const IdentityId = getIdResponse.IdentityId;  
  config.public.isDev && console.log("IdentityId", IdentityId);
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/getcredentialsforidentitycommand.html
  const getCredentialsForIdentityCommand = new GetCredentialsForIdentityCommand({
    IdentityId, Logins
  });
  const getCredentialsResponse = client.send(getCredentialsForIdentityCommand);

  // １時間で期限切れの「一時的な認証情報」を取得する（有効期限は credentials.Expiration に "2022-06-29T23:23:47.000Z" のような形式で入っている）
  // この「一時的な認証情報」には、AccessKeyId, SecretKey, SessionToken が含まれており、
  // これら全ての認証情報が、都度更新される使い捨てのキーになっている。
  // getCredentials は Cognito ID Pools のAPIのひとつだが、
  // その仕組みには、STS (AWS Security Token Service) が使われている。
  const credentials = (await getCredentialsResponse).Credentials;
  config.public.isDev && console.log({credentials});
  return credentials;
}
