import pkceChallengeModule from 'pkce-challenge'

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
  
  //TODO PKCE
  const {code_challenge, code_verifier} = pkceChallenge();
  setCookie(event, "transaction_id", "hogefugehoge", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  
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