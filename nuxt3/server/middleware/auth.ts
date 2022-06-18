// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler((event) => {
  const query = useQuery(event);
  // Cognito Login Endpoint を経由して得られる認証コード
  const code = query.code;

  if (code) {
    // 認証コードをトークンエンドポイントにPOSTする
    console.log({code});
    // Base64Encode(client_id:client_secret) を生成する
    const clientId = "bo73u1ihm98ttrqe5dfkolq7d";
    const clientSecret = code;
    const clientIdSecret = `${clientId}:${clientSecret}`;
    const clientIdSecretBase64 = Buffer.from(clientIdSecret).toString('base64');
    const tokenEndpoint = "https://quartz.auth.ap-northeast-1.amazoncognito.com/oauth2/token";
    fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${clientIdSecretBase64}`,
      },
      body: `
        grant_type=authorization_code&
        client_id=bo73u1ihm98ttrqe5dfkolq7d&
        redirect_uri=localhost:3000&
        code=${code}
      `
    }).then(res => {
      const json = res.json();
      return json;
    }).then(json => {
      console.log({json});
    });
    // useFetch(tokenEndpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Authorization': `Basic bo73u1ihm98ttrqe5dfkolq7d`
    //   },
    //   body: `grant_type=authorization_code&code=${code}&redirect_uri=${process.env.AUTH_REDIRECT_URI}`
    // }).then(res => {
    //   console.log({res});
    // }).catch(err => {
    //   console.log({err});
    // });
  }

  if (!event.req.url?.startsWith('/api/') && !code) {
    event.res.writeHead(302, {
      Location: 'https://quartz.auth.ap-northeast-1.amazoncognito.com/login?client_id=bo73u1ihm98ttrqe5dfkolq7d&redirect_uri=http://localhost:3000&response_type=code'
    });
    event.res.end();
  }
})