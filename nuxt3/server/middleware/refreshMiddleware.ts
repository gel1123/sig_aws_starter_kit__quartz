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
    
    // トークン取得に失敗したなら、ログイン前の状態のままトップページにリダイレクトさせる。
    if (!json.access_token) {
      deleteCookie(event, "refresh_token");
      deleteCookie(event, "is_logged_in");
      event.res.writeHead(302, {
        Location: config.redirectUrl
      });
      event.res.end();
    }
  }
});