import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { CfnOutput, Duration, PhysicalName, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AllowedMethods, CachePolicy, CloudFrontAllowedMethods, CloudFrontWebDistribution, Distribution, experimental, LambdaEdgeEventType, OriginAccessIdentity, OriginRequestCookieBehavior, OriginRequestPolicy, PriceClass, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { AttributeType, BillingMode, ProjectionType, Table } from "aws-cdk-lib/aws-dynamodb";
// import { ArnPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // <--------Cognito-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito-readme.html
    const userPool = new UserPool(this, 'quartz_userpool', {
      userPoolName: 'quartz_app-userpool',
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: {
        email: true,
      },
    });
    userPool.addClient('quartz_app-userpool-client', {
      userPoolClientName: 'quartz_app-userpool-client',
      generateSecret: true,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      authFlows: {
        userPassword: true,
        custom: true,
      },
      oAuth: {
        // UserPoolClientの「許可されているコールバック URL」に指定するURL
        callbackUrls: [
          'http://localhost:8000',
          'http://localhost:3000',
          'https://d31y3mgphorb7z.cloudfront.net', 
        ],
        logoutUrls: [
          'http://localhost:8000',
          'http://localhost:3000',
          'https://d31y3mgphorb7z.cloudfront.net', 
        ]
      }
    });
    userPool.addDomain('quartz_app-userpool-domain', {
      cognitoDomain: {
        domainPrefix: 'quartz',
      },
    });
    // </--------Cognito-------->
    
    // <--------S3-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3-readme.html

    /** Nuxt3 Application 静的ファイル用バケット */
    const appBucket = new Bucket(this, "quartzApp-PublicBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const appOai = new OriginAccessIdentity(this, "quartzApp-OAI");
    // CloudFrontの s3OriginSource の設定で最低限のGet権限が付与されるので、下記はいらない
    // appBucket.grantRead(appOai);
    new BucketDeployment(this, "quartzApp-PublicBucket-Deployment", {
      sources: [Source.asset("./nuxt3.output/public")],
      destinationBucket: appBucket
    });
    
    /** 一般公開ファイル用バケット */
    const dataBucket = new Bucket(this, "quartzData-PublicBucket", {

      /**
       * PhysicalName.GENERATE_IF_NEEDED は 内部でus-east1リージョンの子Stackを
       * 作成するEdgeFunctionと、別リージョンの親スタックで定義するS3との間で
       * 生じるエラーを防ぐことができる。
       * 
       * （これは論理名ではなく実際にAWS上でリソース名として割り当てられる物理名を
       * 必要に応じて生成することで、マルチリージョン構成時のエラーを防ぐという仕組みになっている模様）
       * 
       * なお、PhysicalName.GENERATE_IF_NEEDED を正常にクロスリージョン時に動作させるには
       * 「アカウントIDとリージョンを new CdkStack() 時に明示的に設定」
       * する必要がある。
       * 
       * もしアカウントIDを指定せず、暗黙的にIDを指定する形式（例えば実行時の profile オプションのみで動かす）
       * ケースでは、下記のようなエラーが生じる。
       * 
       * ※リージョン未指定時も（確かめてはいないが）おそらく同じようなエラーが生じるはず。
       * （ライブラリ側にそのようなエラーメッセージの出力メッセージがあるのを確認した。
       * ただし、そもそものところ、クロスリージョン時には必ず親Stackのリージョンを明示する必要があるので、
       * 状況的に起こり得ない可能性が高い）
       * 
       * ```
       * Cannot generate a physical name for QuartzStack/quartzData-PublicBucket,
       * because the account is un-resolved or missing.
       * ```
       */
      bucketName: PhysicalName.GENERATE_IF_NEEDED,

      removalPolicy: RemovalPolicy.RETAIN
    });
    const dataOai = new OriginAccessIdentity(this, "quartzData-OAI");
    // CloudFrontの s3OriginSource の設定で最低限のGet権限が付与されるので、下記はいらない
    // dataBucket.grantRead(dataOai);
    // </--------S3-------->

    // <--------DynamoDB-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html
    const dynamoTable = new Table(this, "QuartzTable", {
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: "QUARTZ_TABLE",
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: false
    });
    dynamoTable.addLocalSecondaryIndex({
      indexName: "QUARTZ_LSI_1",
      sortKey: { name: "LSI_1", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });
    dynamoTable.addLocalSecondaryIndex({
      indexName: "QUARTZ_LSI_2",
      sortKey: { name: "LSI_2", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });
    dynamoTable.addLocalSecondaryIndex({
      indexName: "QUARTZ_LSI_3",
      sortKey: { name: "LSI_3", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });
    dynamoTable.addLocalSecondaryIndex({
      indexName: "QUARTZ_LSI_4",
      sortKey: { name: "LSI_4", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });
    dynamoTable.addLocalSecondaryIndex({
      indexName: "QUARTZ_LSI_5",
      sortKey: { name: "LSI_5", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    const dynamoSession = new Table(this, "QuartzSession", {
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: "QUARTZ_SESSION",
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
      timeToLiveAttribute: "TTL",
    });
    // </--------DynamoDB-------->

    // <--------Lambda-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html
    /**
     * Lambda@Edgeなら、EdgeFunctionインスタンスでないと、スタック全体のリージョンとの差異がある場合にエラーになる。
     * ※ `Lambda@Edge`は us-east-1 リージョン限定（CloudFrontに紐づいているから）
     * 参考にさせていただいた記事：https://www.dkrk-blog.net/aws/lambda_edge_crossregion
     */
    const lambdaEdge = new experimental.EdgeFunction(this, "quartzEdgeLambdaHandler", {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./nuxt3.output/server"),
      handler: "edge.handler",
      logRetention: RetentionDays.ONE_MONTH,
      timeout: Duration.seconds(30),
      memorySize: 2048
    });
    dynamoTable.grantReadWriteData(lambdaEdge);
    dynamoSession.grantReadWriteData(lambdaEdge);
    
    /**
     * 前述の「PhysicalName.GENERATE_IF_NEEDED」を利用せず、
     * 単に bucketName: undefined とする形式でのバケット名自動生成を利用している場合に、
     * `dataBucket.grantReadWrite(lambdaEdge)` のようなコードを実行すると
     * 次のエラーが生じる。
     * 
     * ```
     * Resolution error:
     *   Cannot use resource 'QuartzStack/quartzData-PublicBucket'
     *   in a cross-environment fashion,
     *   the resource's physical name must be explicit set
     *   or use `PhysicalName.GENERATE_IF_NEEDED`.
     * ```
     * 
     * なおGENERATE_IF_NEEDEDを使わずとも、文字列で明示的にバケット名を
     * 定義している場合は、上記のエラーは生じない見込み。
     * 
     * (ただしS3バケットはグローバルで一意の名前をつけないといけないという制約がある)
     */
    dataBucket.grantReadWrite(lambdaEdge);


    /**
     * 直書き用ARNが手に入るまでは下記2点のaddToResourcePolicyをコメントアウトしてデプロイすべき。
     * なお、ここで必要としているARNは `Lambda@Edge` としてCloudFrontのビヘイビアに紐づいているLambdaのARNではなく、
     * そのLambdaに割り当てられているロールのARNである。
     * 
     * これは管理コンソールの us-east-1のLambdaの「アクセス権限」メニューからロールのページに飛び、
     * そこで参照することができる。
     * 
     * _____________
     * 
     * 追記：
     * もしかして過剰だった....? と思い一部をコメントアウト。
     */
    // appBucket.addToResourcePolicy( //<= Lambda@EdgeのロールARNを取得したかったが、内包されたStackから参照できなかったのでARN直書き
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ["s3:GetObject"],
    //     principals: [new ArnPrincipal(
    //       "arn:aws:iam::904914921037:role/edge-lambda-stack-c82cecc-quartzEdgeHandlerService-13RGGZK18DR81"
    //     )],
    //     resources: [appBucket.bucketArn + "/*"]
    //   })
    // );
    // dataBucket.addToResourcePolicy( //<= Lambda@EdgeのロールARNを取得したかったが、内包されたStackから参照できなかったのでARN直書き
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ["s3:GetObject", "s3:PutObject"],
    //     principals: [new ArnPrincipal(
    //       "arn:aws:iam::904914921037:role/edge-lambda-stack-c82cecc-quartzEdgeHandlerService-13RGGZK18DR81"
    //     )],
    //     resources: [dataBucket.bucketArn + "/*"]
    //   })
    // );
    // </--------Lambda-------->

    // <--------CloudFront-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html

    // /**
    //  * CloudFrontWebDistribution は 2022年2月時点の情報によると
    //  * 近いうちに非推奨になるとのこと。
    //  * そういった経緯により、Cookieまわりの新しい推奨オプションであるところの
    //  * OriginRequestPolicyや、CachePolicyを用いた設定が実装されていない。
    //  * 
    //  * これに代わって推奨されるのは Distribution クラスとのこと。
    //  * そちらでは上記Cookie周りのオプションが対応している。
    //  */ 
    // const distribution = new CloudFrontWebDistribution(this, "quartzCdn", {
    //   priceClass: PriceClass.PRICE_CLASS_200, // 価格クラス200以降は日本を含む
    //   defaultRootObject: "", //<= defaultでは index.html になるが、不要なのであえて空文字にしておく
    //   originConfigs: [
    //     {
    //       s3OriginSource: {
    //         s3BucketSource: dataBucket,
    //         originAccessIdentity: dataOai
    //       },
    //       behaviors: [
    //         { // パターン的にこれが一番優先度高くなるよう定義しないと、ここに到達しないケースが生じる
    //           isDefaultBehavior: false,
    //           pathPattern: "/items/*",
    //           defaultTtl: Duration.minutes(5), //安定したらもっと長くてもOK
    //         }
    //       ]
    //     },
    //     {
    //       s3OriginSource: {
    //         s3BucketSource: appBucket,
    //         originAccessIdentity: appOai
    //       },
    //       behaviors: [
    //         {
    //           isDefaultBehavior: false,
    //           pathPattern: "/*.*",
    //           defaultTtl: Duration.seconds(240),
    //           minTtl: Duration.seconds(120),
    //           maxTtl: Duration.seconds(300),
    //         },
    //         {
    //           isDefaultBehavior: true,
    //           pathPattern: "*",
    //           defaultTtl: Duration.seconds(20),
    //           minTtl: Duration.seconds(10),
    //           maxTtl: Duration.seconds(30),
    //           lambdaFunctionAssociations: [
    //             {
    //               eventType: LambdaEdgeEventType.ORIGIN_REQUEST, //<= 当初ﾋﾞｭｰｱﾘｸｴｽﾄで定義していたが、Lambda@Edgeサイズ制限にひっかかったのでORIGIN_REQUESTに変更
    //               lambdaFunction: lambdaEdge.currentVersion,
    //               includeBody: true //<= これがないと下記でPOST受け入れてもリクエストボディが届かない
    //             }
    //           ],
    //           allowedMethods: CloudFrontAllowedMethods.ALL, //<= Lambda@EdgeはデフォルトでPOST等受け入れないので、受け入れるようにする
    //           forwardedValues: { // <= QueryStringも設定しないと受け入れないので、設定する
    //             queryString: true,
    //             cookies: {
    //               // 非推奨オプションであり、 cache policy を使用すべき
    //               forward: "all"
    //             }
    //           },    
    //         },
    //       ]
    //     }
    //   ],
    // });
    const dataBucketOrigin = new S3Origin(dataBucket, {
      originAccessIdentity: dataOai,
    });
    const appBucketOrigin = new S3Origin(appBucket, {
      originAccessIdentity: appOai,
    });
    const distribution = new Distribution(this, "quartzCdn", {
      priceClass: PriceClass.PRICE_CLASS_200, // 価格クラス200以降は日本を含む
      defaultRootObject: "", //<= defaultでは index.html になるが、不要なのであえて空文字にしておく
      defaultBehavior: {
        origin: appBucketOrigin,
        allowedMethods: AllowedMethods.ALLOW_ALL, //<= Lambda@EdgeはデフォルトでPOST等受け入れないので、受け入れるようにする
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
        originRequestPolicy: new OriginRequestPolicy(this, "quartzORP", {
          cookieBehavior: OriginRequestCookieBehavior.all()
        }),
        cachePolicy: new CachePolicy(this, "QuartzEdgeLambdaCachePolicy", {
          minTtl: Duration.seconds(10),
          defaultTtl: Duration.seconds(20),
          maxTtl: Duration.seconds(30),
        }),
        edgeLambdas: [{
          eventType: LambdaEdgeEventType.ORIGIN_REQUEST, //<= 当初ﾋﾞｭｰｱﾘｸｴｽﾄで定義していたが、Lambda@Edgeサイズ制限にひっかかったのでORIGIN_REQUESTに変更
          functionVersion: lambdaEdge.currentVersion,
          includeBody: true, //<= これがないと下記でPOST受け入れてもリクエストボディが届かない
        }]
      },
      additionalBehaviors: {
        "/items/*": {
          // ブラウザから直接ダウンロードする画像などのファイル保管庫であり、
          // 「更新」なしでの運用を行う前提で1ヵ月キャッシュする。
          // ※削除後のキャッシュ残問題は、パスをDynamoDBから返さない運用とするため問題なし
          origin: dataBucketOrigin,
          cachePolicy: new CachePolicy(this, "QuartzDataBucketCachePolicy", {
            defaultTtl: Duration.days(30),
          }),
        },
        "/*.*": {
          origin: appBucketOrigin,
          cachePolicy: new CachePolicy(this, "QuartzAppBucketCachePolicy", {
            minTtl: Duration.minutes(2),
            defaultTtl: Duration.minutes(4),
            maxTtl: Duration.minutes(5),
          }),
        },
      },
    });

    new CfnOutput(this, "CF URL", {
      value: `https://${distribution.distributionDomainName}`
    });
    // </--------CloudFront-------->
  }
}
