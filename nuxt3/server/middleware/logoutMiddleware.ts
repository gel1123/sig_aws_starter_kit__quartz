// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {
  
  if (event.req.url !== ('/logout')) return;

  // 認証情報に関するCookie
  const cookies = useCookies(event);
  
  //TODO state

  const query = useQuery(event);
  const config = useRuntimeConfig();

  // Cognito Login Endpoint を経由して得られる認証コード
  const code = query.code;

  if (!event.req.url?.startsWith('/api/') && !code) {
    deleteCookie(event, "refresh_token");
    deleteCookie(event, "access_token");
    deleteCookie(event, "is_logged_in");
    event.res.writeHead(302, {
      Location: `${config.logoutEndpoint}?client_id=${config.clientId}&logout_uri=${config.redirectUrl}`
    });
    event.res.end();
  }
});
