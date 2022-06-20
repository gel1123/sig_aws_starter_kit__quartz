import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: "ap-northeast-1_4LMZhoi0a",
  tokenUse: "access",
  clientId: "bo73u1ihm98ttrqe5dfkolq7d",
});

// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler(async (event) => {
  if (event.req.url?.startsWith('/api/')) {
    const access_token = useCookies(event).access_token;
    try {
      // トークン検証（失敗すれば例外が発生する。例外なしなら、検証成功）
      await verifier.verify(access_token);
    } catch (_error) {
      event.res.writeHead(403, {
        "Content-Type": "text/plain"
      });
      event.res.end("Unauthorized");
      return;
    }
  }
});