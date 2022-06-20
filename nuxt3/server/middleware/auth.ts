// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {

  //TODO PKCE
  //TODO state (sessionはそのままDynamoDBに保存するのが妥当か)
  //TODO refreshToken

  const query = useQuery(event);
  // Cognito Login Endpoint を経由して得られる認証コード
  const code = query.code;

  if (code) {
    // Base64Encode(client_id:client_secret) を生成する
    const clientId = "bo73u1ihm98ttrqe5dfkolq7d";
    const clientSecret = "8j43e02bdvv3hf683uag0dti3ch249tdfiqa4dv6dn1td051skd";
    const clientIdSecret = `${clientId}:${clientSecret}`;
    const clientIdSecretBase64 = Buffer.from(clientIdSecret).toString('base64');

    // 認証コードをトークンエンドポイントにPOSTする
    const tokenEndpoint = "https://quartz.auth.ap-northeast-1.amazoncognito.com/oauth2/token";
    const res = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${clientIdSecretBase64}`,
      },
      body: "grant_type=authorization_code&" +
      "redirect_uri=http://localhost:3000&" +
      `code=${code}`
    });
    const json = await res.json();

    const cookieOption = {
      httpOnly: true,
      secure: true,
      sameSite: "strict" as "strict",
      maxAge: json.expires_in
    };
    json.access_token ?
      setCookie(event, "access_token", json.access_token, cookieOption)
      : deleteCookie(event, "access_token");
    json.id_token ?
      setCookie(event, "id_token", json.id_token, cookieOption)
      : deleteCookie(event, "id_token");
    json.refresh_token ?
      setCookie(event, "refresh_token", json.refresh_token, cookieOption)
      : deleteCookie(event, "refresh_token");
    json.expires_in ?
      setCookie(event, "expires_in", json.expires_in, cookieOption)
      : deleteCookie(event, "expires_in");

    // トークン取得に失敗したなら、再度ログイン画面にリダイレクトさせる。
    if (!json.access_token) {
      console.log("---- redirect (トークン取得失敗) ----");
      event.res.writeHead(302, {
        Location: 'https://quartz.auth.ap-northeast-1.amazoncognito.com/login?client_id=bo73u1ihm98ttrqe5dfkolq7d&redirect_uri=http://localhost:3000&response_type=code'
      });
      event.res.end();
    }
  }

  // 認証情報に関するCookie
  const cookies = useCookies(event);

  if (!cookies["access_token"] && !event.req.url?.startsWith('/api/') && !code) {
    console.log("---- redirect (ログイン試行開始) ----");
    event.res.writeHead(302, {
      Location: 'https://quartz.auth.ap-northeast-1.amazoncognito.com/login?client_id=bo73u1ihm98ttrqe5dfkolq7d&redirect_uri=http://localhost:3000&response_type=code'
    });
    event.res.end();
  }
});