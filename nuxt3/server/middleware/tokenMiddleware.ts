import { getDynamoDBDocumentClient } from "~~/repository/dynamoDBRepository";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import * as idp from "@aws-sdk/client-cognito-identity";
import { ClientOnly } from '../../.nuxt/components';

// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {

  // 認証情報に関するCookie
  const cookies = useCookies(event);
  if (cookies['access_token'] || (
    !cookies['access_token'] && cookies['refresh_token']
  )) {
    return;
  }

  const query = useQuery(event);
  const config = useRuntimeConfig();

  // Cognito Login Endpoint を経由して得られる認証コード
  const code = query.code;

  if (code) {

    // for PKCE
    const DDC = getDynamoDBDocumentClient({region: config.public.region});
    const result = await DDC.send(new GetCommand({
      TableName: config.sessionTable,
      Key: {
        PK: cookies['transaction_id'],
      }
    }));

    if (result.$metadata.httpStatusCode !== 200) {
      event.res.writeHead(result.$metadata.httpStatusCode ?? 500, {"Content-Type": "text/plain"});
      event.res.end("Internal Server Error [A]");
      return;
    }

    const code_verifier = result.Item?.code_verifier as string | undefined;
    const state = result.Item?.state as string | undefined;
    if (!code_verifier || !state) {
      event.res.writeHead(500, {"Content-Type": "text/plain"});
      event.res.end("Internal Server Error [B]");
      return;
    }

    // Cognito Login Endpoint にパラメータとして渡したSTATEが、変化のないまま受け取れたか検証する
    if (!state || state !== query.state) {
      // state不一致は攻撃を受けた可能性があるので、先に進ませない
      event.res.writeHead(302, {
        Location: config.redirectUrl
      });
      event.res.end();
      return;
    }

    // Base64Encode(client_id:client_secret) を生成する
    const clientIdSecret = `${config.clientId}:${config.clientSecret}`;
    const clientIdSecretBase64 = Buffer.from(clientIdSecret).toString('base64');

    // 認証コードをトークンエンドポイントにPOSTする
    const tokenEndpoint = config.tokenEndpoint;
    const res = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${clientIdSecretBase64}`,
      },
      body: "grant_type=authorization_code&" +
      `redirect_uri=${config.redirectUrl}&` +
      `code=${code}&` + 
      `code_verifier=${code_verifier}`
    });
    const json = await res.json();
    // config.public.isDev && console.log("idToken", json.id_token.substring(0, 10) + "..."); 
    // config.public.isDev && console.log("accessToken", json.access_token.substring(0, 10) + "...");
    // config.public.isDev && console.log("config.public.identityPoolId", config.public.identityPoolId.substring(0, 10) + "...");
    // config.public.isDev && console.log("認可コード：", code);

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/getidcommand.html
    const client = new idp.CognitoIdentityClient(config);
    const providerName = `cognito-idp.${config.public.region}.amazonaws.com/${config.userPoolId}`;
    const Logins: {[providerName: string]: string} = {};
    Logins[providerName] = json.id_token;
    const getIdCommand = new idp.GetIdCommand({
      IdentityPoolId: config.public.identityPoolId, Logins
    });
    const getIdResponse = await client.send(getIdCommand);
    const IdentityId = getIdResponse.IdentityId;

    config.public.isDev && console.log("IdentityId", IdentityId);
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/getcredentialsforidentitycommand.html
    const getCredentialsForIdentityCommand = new idp.GetCredentialsForIdentityCommand({
      IdentityId, Logins
    });
    const getCredentialsResponse = client.send(getCredentialsForIdentityCommand);
    const credentials = (await getCredentialsResponse).Credentials;
    console.log({credentials});


    json.access_token ?
      setCookie(event, "access_token", json.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: json.expires_in,
      })
      : deleteCookie(event, "access_token");
    json.refresh_token ?
      setCookie(event, "refresh_token", json.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        // デフォルトでは更新トークンの有効期限は30日であり、変更が可能。
        // 必要に応じて、更新トークンの有効期限の分だけmaxAgeを拡張し、
        // 再ログインの手間を省くこともできる。
        // （ただしここでは、maxAgeを設定せず保持期間をセッション中に留めている）
        //
        // 参考：更新トークンの使用
        // https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-refresh-token.html
      })
      : deleteCookie(event, "refresh_token");
    json.refresh_token ?
      setCookie(event, "is_logged_in", "1", {
        // Nuxt3フロントエンドにおけるログイン判定用クッキーであるため、httpOnlyをfalseにしている
        httpOnly: false,
        secure: true,
        sameSite: "strict",
      })
      : deleteCookie(event, "is_logged_in");

    // トークン取得に失敗したなら、ログイン前の状態のままトップページにリダイレクトさせる。
    if (!json.access_token) {
      event.res.writeHead(302, {
        Location: config.redirectUrl
      });
      event.res.end();
    }
  }
});