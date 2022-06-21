import pkceChallengeModule from 'pkce-challenge'
import { v4 } from 'uuid';
import { getDynamoDBDocumentClient } from '~~/repository/dynamoDBRepository';
import { PutCommand } from "@aws-sdk/lib-dynamodb";


// CommonJS形式のモジュールのnamespace import にまつわる問題のため、直接defaultをimportしている
//（参考：https://chaika.hatenablog.com/entry/2022/05/29/083000）
// @ts-ignore
const pkceChallenge = pkceChallengeModule.default as (length?: number) => {
  code_verifier: string;
  code_challenge: string;
};

// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {

  // 認証情報に関するCookie
  const cookies = useCookies(event);
  
  if (cookies['access_token']) return;
  if (!cookies['access_token'] && cookies['refresh_token']) return;
  if (event.req.url !== ('/login')) return;
  
  // for PKCE
  const {code_challenge, code_verifier} = pkceChallenge();
  const transactionId = v4();
  console.log({transactionId});
  setCookie(event, "transaction_id", transactionId, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  // SESSION_TABLE にトランザクションIDをキーとして、OKCEのcode_challengeを保存する
  const DDC = getDynamoDBDocumentClient();
  const result = await DDC.send(new PutCommand({
    TableName: process.env.SESSION_TABLE,
    Item: {
      PK: transactionId,
      code_verifier,
      // TTL属性の値は、Unix エポック時間形式のタイムスタンプ (秒単位) であり、ここでは5分後になるように設定している
      TTL: Math.floor(Date.now() / 1000) + 300,
    },
  }));

  if (result.$metadata.httpStatusCode !== 200) {
    event.res.writeHead(result.$metadata.httpStatusCode ?? 500, {"Content-Type": "text/plain"});
    event.res.end("Internal Server Error");
    return;
  }
  
  //TODO state (sessionはそのままDynamoDBに保存するのが妥当か)

  const query = useQuery(event);
  const config = useRuntimeConfig();

  // Cognito Login Endpoint を経由して得られる認証コード
  const code = query.code;

  if (!event.req.url?.startsWith('/api/') && !code) {
    event.res.writeHead(302, {
      Location: `${config.loginEndpoint}?`
        + `client_id=${config.clientId}&`
        + `redirect_uri=${config.redirectUrl}&`
        + "response_type=code&"
        + "code_challenge_method=S256&"
        + `code_challenge=${code_challenge}&`
    });
    event.res.end();
  }
});