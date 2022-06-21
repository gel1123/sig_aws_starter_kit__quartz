
export const refresh = async (cookies: Record<string, string>) => {
  const config = useRuntimeConfig();
  // refresh_tokenでアクセストークンを再取得する
  const clientIdSecret = `${config.clientId}:${config.clientSecret}`;
  const clientIdSecretBase64 = Buffer.from(clientIdSecret).toString('base64');
   // 認証コードをトークンエンドポイントにPOSTする
  const tokenEndpoint = config.tokenEndpoint;
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${clientIdSecretBase64}`,
    },
    body: "grant_type=refresh_token&" +
    `refresh_token=${cookies['refresh_token']}`
  });
  const json = await res.json();
  return json as { access_token: string, expires_in: number };
};
