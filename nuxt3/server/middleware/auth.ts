// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler((event) => {
  const query = useQuery(event);
  // Cognito Login Endpoint を経由して得られる認証コード
  const code = query.code;

  if (code) {
    // Base64Encode(client_id:client_secret) を生成する
    const clientId = "bo73u1ihm98ttrqe5dfkolq7d";
    const clientSecret = "8j43e02bdvv3hf683uag0dti3ch249tdfiqa4dv6dn1td051skd";
    const clientIdSecret = `${clientId}:${clientSecret}`;
    const clientIdSecretBase64 = Buffer.from(clientIdSecret).toString('base64');

    console.log({code, clientIdSecret});

    // 認証コードをトークンエンドポイントにPOSTする
    const tokenEndpoint = "https://quartz.auth.ap-northeast-1.amazoncognito.com/oauth2/token";
    fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${clientIdSecretBase64}`,
      },
      body: "grant_type=authorization_code&" +
      "redirect_uri=http://localhost:3000&" +
      `code=${code}`
    }).then(res => {
      const json = res.json();
      return json;
    }).then(json => {
      console.log({json});
    });
  }

  if (!event.req.url?.startsWith('/api/') && !code) {
    event.res.writeHead(302, {
      Location: 'https://quartz.auth.ap-northeast-1.amazoncognito.com/login?client_id=bo73u1ihm98ttrqe5dfkolq7d&redirect_uri=http://localhost:3000&response_type=code'
    });
    event.res.end();
  }
})