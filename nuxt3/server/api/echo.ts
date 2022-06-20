import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: "ap-northeast-1_4LMZhoi0a",
  tokenUse: "access",
  clientId: "bo73u1ihm98ttrqe5dfkolq7d",
});

/**
 * https://v3.nuxtjs.org/guide/features/server-routes/
 * 
 * #### curl例
 * ```
 * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' http://localhost:3000/api/echo
 * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' https://d31y3mgphorb7z.cloudfront.net/api/echo
 * ```
 * 
 * #### 注：
 * Content-Type: application/json は必須
 */
export default defineEventHandler(async (e) => {
  const access_token = useCookies(e).access_token;
  try {
    // トークン検証（失敗すれば例外が発生する。例外なしなら、検証成功）
    await verifier.verify(access_token);
  } catch (_error) {
    e.res.writeHead(403, {
      "Content-Type": "text/plain"
    });
    e.res.end("Unauthorized");
    return;
  }
  const body =  e.req.method === 'POST' ? await useBody<string>(e) : undefined;
  const query = useQuery(e);
  return {body, query};
});