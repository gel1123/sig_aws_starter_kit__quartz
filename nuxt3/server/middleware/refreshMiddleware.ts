import { refresh } from "~~/service/auth/refresh";

// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {

  // 認証情報に関するCookie
  const cookies = useCookies(event);
  if (cookies['access_token']) {
    return;
  }
  if (cookies['refresh_token']) {
    const config = useRuntimeConfig();
    const json = await refresh(cookies);
    json.access_token ?
      setCookie(event, "access_token", json.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: json.expires_in,
      })
      : deleteCookie(event, "access_token");
     // トークン取得に失敗したなら、再度ログイン画面にリダイレクトさせる。
    if (!json.access_token) {
      event.res.writeHead(302, {
        Location: `${config.loginEndpoint}?client_id=${config.clientId}&redirect_uri=${config.redirectUrl}&response_type=code`
      });
      event.res.end();
    }
  }
});