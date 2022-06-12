
アクセスしたURL

https://quartz.auth.ap-northeast-1.amazoncognito.com/login?client_id=585u6087vhvpgvfcbfjpm2gj17&&redirect_uri=http://localhost:8000&response_type=token


画面表示

```
# https://quartz.auth.ap-northeast-1.amazoncognito.com/error?error=redirect_mismatch&client_id=585u6087vhvpgvfcbfjpm2gj17
An error was encountered with the requested page.
```

ネットワークタブを見るとこんな応答

```
error: redirect_mismatch
```

参考

https://stackoverflow.com/questions/50936774/amazon-cognito-how-to-stop-getting-redirect-mismatch-error-when-redirecting-f

CDKならこう定義すべき

```

```

https://stackoverflow.com/questions/68000868/getting-error-400-redirect-uri-mismatch-in-cognito-idp-settings

