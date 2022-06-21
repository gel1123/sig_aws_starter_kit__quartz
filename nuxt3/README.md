## 参考サイト
* https://std9.jp/articles/01fq14pxsp4r6nbyzp2txj46ac

## .env
`../build.sh` の都合上、下記を用意してください。
- .local.env (ローカル環境で動作させたい時の環境設定)
- .dev.env （AWS上で動作させたい時の環境設定）

## TIPS
`The security token included in the request is invalid.` などとエラーが生じた場合、 `aws configure` を要する。

もしくは profile を用いてAWSリソースにアクセスしたいなら、下記で環境変数にセットする。

```
export AWS_PROFILE=profile_name
```
だがここまでやっても下記のエラーが出る場合は、
プロファイル名が当たっているかどうかなどを確認すること。

```
Could not load credentials from any providers
```
