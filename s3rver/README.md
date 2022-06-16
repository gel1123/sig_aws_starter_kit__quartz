## これはなに
テストや検証のためにローカルで動かすS3のサーバです

## 使い方

### モックとして動かすS3をマウントするディレクトリを指定してサーバ起動

```
npx s3rver -d ./mount
```

### モック向けにs3apiを実行するためのプロファイルを作成

```
$ aws configure --profile mock-s3
AWS Access Key ID [None]: S3RVER
AWS Secret Access Key [None]: S3RVER
Default region name [None]: 
Default output format [None]: 
```

### エンドポイントを指定してバケットを作成する

```
# バケット作成
aws --endpoint-url http://localhost:4568 s3api create-bucket --bucket test-bucket.localhost --profile mock-s3

# バケット確認
aws --endpoint http://localhost:4568 s3api list-buckets --profile mock-s3
```

### そのほかコマンドまとめ

```
# バケットの中身一覧
aws --endpoint http://localhost:4568 s3api list-objects --bucket test-bucket.localhost --profile mock-s3
```

## つまづいたことのメモ
なにやらs3rverのバケットにaws-sdk3からアクセスを試みると、バケット名の末尾にドメイン名（.localhost）が付与される。
（このメモを書いた時には知らなかったが、これは後述のパススタイル云々によるものである）

```
// これでsdk3からアクセスすると
const list = await client.send(new ListObjectsCommand({
    Bucket: "test-bucket",
    Prefix: "hoge"
}))


// こうなる
error: No bucket found for "test-bucket.localhost"
```

なのでローカル検証用バケット名は、これを考慮した命名にする。

## M1 Macで動かす時のトラブルシューティング
S3へのpush時のみ、次のようなエラーが出た.

```
Error: getaddrinfo ENOTFOUND test-bucket.localhost\n    at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:71:26)
```

類似事例でググると次の記事がヒットした。
https://stackoverflow.com/questions/71272921/serverless-s3-local-plugin-and-aws-sdk-client-s3-returns-an-error-with-putobjec

なので、この記事に従い、次のように修正した。

```
//---- S3C作成時 ----
// AsIs
const config: S3ClientConfig = cchEnv.mode === "dev" ? {
    region: cchEnv.region,
    endpoint: 'http://localhost:4568', //<= Local用 (S3rver)
    credentials: {
        accessKeyId: "S3RVER",
        secretAccessKey: "S3RVER"
    },
}

// ToBe
const config: S3ClientConfig = cchEnv.mode === "dev" ? {
    region: cchEnv.region,
    endpoint: 'http://localhost:4568', //<= Local用 (S3rver)
    credentials: {
        accessKeyId: "S3RVER",
        secretAccessKey: "S3RVER"
    },
    forcePathStyle: true, //<= S3rver on M1 Mac1用
}
```

さらにパススタイルが変わったので、send時に指定するバケット名も変えた。

```
//---- send実行時 ----
// AsIs
const bucketName = env.mode === "dev" ? "test-bucket.localhost" : env.bucket;
await S3C.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: `${boardID}/${threadID}/${postID}/data.json`,
    Body: JSON.stringify(s3postRecord)
}));


// ToBe
const bucketName = env.mode === "dev" ? "test-bucket" : env.bucket;
await S3C.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: `${boardID}/${threadID}/${postID}/data.json`,
    Body: JSON.stringify(s3postRecord)
}));
```

なおパススタイル云々については、こちらの記事がわかりやすい。
https://zenn.dev/hiroga/scraps/cbb721e2a496f8


## 参考にさせていただいた記事
[【S3rver】ローカルでモックS3を起動する](https://zenn.dev/ryohei/articles/startup-s3rver)

