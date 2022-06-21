
/**
 * https://v3.nuxtjs.org/guide/features/server-routes/
 * 
 * #### curl例
 * ```
 * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' http://localhost:3000/api/echo
 * ```
 * 
 * #### 注：
 * Content-Type: application/json は必須
 */
export default defineEventHandler(async (e) => {
  const body =  e.req.method === 'POST' ? await useBody<string>(e) : undefined;
  const query = useQuery(e);
  return {body, query};
});
