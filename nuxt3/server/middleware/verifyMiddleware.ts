import { CognitoJwtVerifier } from "aws-jwt-verify";
import { refresh } from "~~/service/auth/refresh";

// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {

  if (
    event.req.url?.startsWith('/api/')
    && !event.req.url?.startsWith("/api/getItemRecord")
  ) {

    const config = useRuntimeConfig();
    const verifier = CognitoJwtVerifier.create({
      userPoolId: config.userPoolId,
      tokenUse: "access",
      clientId: config.clientId,
    });
    const cookies = useCookies(event);
    const access_token = cookies['access_token'] ? cookies['access_token']
      : await (async () => {

        if (cookies["refresh_token"]) {
          const json = await refresh({cookies, ...config});
          json.access_token ?
            setCookie(event, "access_token", json.access_token, {
              httpOnly: true,
              secure: true,
              sameSite: "strict",
              maxAge: json.expires_in,
            })
            : deleteCookie(event, "access_token");
          return json.access_token;
  
        } else {
          return null;
        }
      })();
    
    if (!access_token) {
      event.res.writeHead(403, {"Content-Type": "text/plain"});
      event.res.end("Unauthorized");
      return;
    }

    try {
      // トークン検証（失敗すれば例外が発生する。例外なしなら、検証成功）
      await verifier.verify(access_token);
    } catch (_error) {
      event.res.writeHead(403, {"Content-Type": "text/plain"});
      event.res.end("Unauthorized");
      return;
    }
  }
});