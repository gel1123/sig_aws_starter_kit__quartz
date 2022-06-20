import jwt_decode from 'jwt-decode';

/**
 * https://v3.nuxtjs.org/guide/features/server-routes/
 * 
 * ```
 * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' http://localhost:3000/api/echo
 * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' https://d31y3mgphorb7z.cloudfront.net/api/echo
 * ```
 */
export default defineEventHandler(async (e) => {
  const body =  e.req.method === 'POST' ? await useBody<string>(e) : undefined;
  const query = useQuery(e);
  const access_token = useCookies(e).access_token;
  const decoded = jwt_decode<{ [name: string]: string }>(access_token);
  console.log({decoded});
  if (typeof body === 'object') {
    Object.keys(body).forEach(k => {
      console.log(`key: ${k} value: ${body[k]}`);
    })
  }
  return {body, query, decoded};
});