
/**
 * https://v3.nuxtjs.org/guide/features/server-routes/
 * 
 * ```
 * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' http://localhost:3000/api/echo
 * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' https://d31y3mgphorb7z.cloudfront.net/api/echo
 * ```
 */
export default defineEventHandler(async (e) => {
  const body = await useBody(e);
  const query = await useQuery(e);
  console.log(body);
  console.log(typeof body);
  if (typeof body === 'object') {
    Object.keys(body).forEach(k => {
      console.log(`key: ${k} value: ${body[k]}`);
    })
  }
  return {body, query}
});