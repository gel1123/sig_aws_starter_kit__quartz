import * as output from "./index.mjs";

async function handler(event, context, callback) {
  // Lambda@Edgeに到達する「body」はクライアントのリクエストボディ以外に情報が付与されているので、本来のボディだけを取得
  const bodyData = event.Records[0].cf.request.body &&
    event.Records[0].cf.request.body.data &&
    Buffer.from(event.Records[0].cf.request.body.data, 'base64').toString();
  // Lambda@Edge向けリクエスト形式を、Nuxt3がビルドしたindex.mjs（Lambdaプロキシ統合を想定）に変換する
  const urlSearchParamsEntries = new URLSearchParams(event.Records[0].cf.request.querystring).entries();
  const queryStringParameters = Object.fromEntries(urlSearchParamsEntries);
  /**
   * Lambda@Edgeの`"headers": { "user-agent": [{ "key": "User-Agent", "value": "Amazon CloudFront" }] }`
   * を、Lambda用に `"headers": { "User-Agent": "Amazon CloudFront" }` に変換する.
   * 
   * ※簡易的に「ヘッダ配列の先頭のみ」を取得しているが、これは偽装されるリスクがあるので、
   * 本当はあまり良くない実装。将来の課題として残している。
   * （ `X-Forwarded-For警察` などの単語で検索すれば、関連する話題が出てくるので、忘れたら読むこと）
   */
  const headers = (()=>{
    const result = {};
    let i = 0;
    const keys = Object.keys(event.Records[0].cf.request.headers);
    while (i < keys.length) {
      const key = event.Records[0].cf.request.headers[keys[i]][0]["key"];;
      const val = event.Records[0].cf.request.headers[keys[i]][0]["value"];
      result[key] = val;
      i = i+1 | 0;
    }
    return result;
  })();
  const e = Object.keys(queryStringParameters).length > 0 ? {
    "resources": event.Records[0].cf.request.uri,
    "path": event.Records[0].cf.request.uri,
    "httpMethod": event.Records[0].cf.request.method,
    headers, queryStringParameters,
    "body": bodyData,
  } : {
    "resources": event.Records[0].cf.request.uri,
    "path": event.Records[0].cf.request.uri,
    "httpMethod": event.Records[0].cf.request.method,
    headers, 
    "body": bodyData,
  }

  // Lambda@Edge用に応答形式を変換
  const res = await output.handler(e, context);

  // console.info("[edge.mjs] event.Records[0].cf.request:", JSON.stringify(event.Records[0].cf.request));
  // console.info("[edge.mjs] res.headers:", JSON.stringify(res.headers));

  const edgeRes = {
    status: res.statusCode,
    headers: {
      'content-type': res.headers['content-type'] ? [{
        key: 'Content-Type',
        value: res.headers['content-type']
      }] : [],
      'location': res.headers['location'] ? [{
        key: 'Location',
        value: res.headers['location']
      }] : [],
      'set-cookie': res.headers['set-cookie'] ? res.headers['set-cookie'].split(",").map(c => {
        // 同一ヘッダはコンマ区切りで返されるので、小分けにしてやる必要あり
        // https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
        return {
          key: 'Set-Cookie',
          value: c
        }
      }) : [],
    },
    body: res.body
  };
  // Lambda@Edge自身がHTTPレスポンスを生成する（この場合、Originには処理が到達しない）
  // 参考1：https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/lambda-generating-http-responses-in-requests.html
  // 参考2：https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html#lambda-examples-generated-response-examples
  callback(null, edgeRes);
}

export { handler };
