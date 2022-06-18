import type { IncomingMessage, ServerResponse } from 'http'

// /**
//  * ```
//  * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' http://localhost:3000/api/echo
//  * ```
//  */
// const mainProcedure = ({body, res}: {
//   body?: string,
//   res: ServerResponse
// }) => {
//   const result = {body};
//   res.writeHead(200, { "Content-Type": "application/json" });
//   res.write(JSON.stringify(result));
//   res.end();
// };

// https://v3.nuxtjs.org/guide/features/server-routes/
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


  // if (req.method !== "POST") {
  //   mainProcedure({res});

  // } else if ((req as any).body) {
  //   const body = (req as any).body;
  //   mainProcedure({body, res});

  // } else {
  //   let body = "";
  //   req.on("data", chunkData => { body += chunkData; });
  //   req.on("end", async () => {
  //     mainProcedure({body, res});
  //   });
  // }
});