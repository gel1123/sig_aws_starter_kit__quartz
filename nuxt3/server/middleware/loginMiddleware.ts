// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {

  // 認証情報に関するCookie
  const cookies = useCookies(event);
  if (cookies['access_token'] || (
    !cookies['access_token'] && cookies['refresh_token']
  )) {
    return;
  }
  
  //TODO PKCE
  //TODO state (sessionはそのままDynamoDBに保存するのが妥当か)

  const query = useQuery(event);
  const config = useRuntimeConfig();

  // Cognito Login Endpoint を経由して得られる認証コード
  const code = query.code;

  if (!event.req.url?.startsWith('/api/') && !code) {
    event.res.writeHead(302, {
      Location: `${config.loginEndpoint}?client_id=${config.clientId}&redirect_uri=${config.redirectUrl}&response_type=code`
    });
    event.res.end();
  }
});