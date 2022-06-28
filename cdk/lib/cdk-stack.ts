import { CfnIdentityPool, CfnIdentityPoolRoleAttachment, UserPool } from 'aws-cdk-lib/aws-cognito';
import { Duration, PhysicalName, RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { AllowedMethods, CacheCookieBehavior, CacheHeaderBehavior, CachePolicy, CacheQueryStringBehavior, Distribution, experimental, LambdaEdgeEventType, OriginAccessIdentity, OriginRequestCookieBehavior, OriginRequestHeaderBehavior, OriginRequestPolicy, OriginRequestQueryStringBehavior, PriceClass, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { AttributeType, BillingMode, ProjectionType, Table } from "aws-cdk-lib/aws-dynamodb";
import { ArnPrincipal, CanonicalUserPrincipal, Effect, FederatedPrincipal, PolicyDocument, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { RoleStack } from './role-stack';
import { L2IdentityPool } from './L2IdentityPool';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const roleStack = new RoleStack(this, `${id}_RoleSubStack`);
    
    // <--------S3-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3-readme.html

    /** Nuxt3 Application 静的ファイル用バケット */
    const appBucket = new Bucket(this, `${id}_Nuxt3AppBucket`, {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const appOai = new OriginAccessIdentity(this, `${id}_Nuxt3AppBucketOAI`);
    new BucketDeployment(this, `${id}_Nuxt3AppBucketDeployment`, {
      sources: [Source.asset("./nuxt3.output/public")],
      destinationBucket: appBucket
    });
    
    /** 一般公開ファイル用バケット */
    const dataBucket = new Bucket(this, `${id}_DataBucket`, {

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
       * Cannot generate a physical name for XXXStack/XXXBucket,
       * because the account is un-resolved or missing.
       * ```
       */
      bucketName: PhysicalName.GENERATE_IF_NEEDED,

      removalPolicy: RemovalPolicy.RETAIN
    });
    const dataOai = new OriginAccessIdentity(this, `${id}_DataBucketOAI`);
    // </--------S3-------->

    // <--------DynamoDB-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html
    const dynamoDataTable = new Table(this, `${id}_DataTable`, {
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      // テーブル名を明示するのはベストプラクティスから外れるが、誤ってデプロイ時に既存レコードを全て削除しないよう、あえて明示している
      // （テーブル名が明示されていれば、テーブル構成変更時には、テーブル名重複エラーにより、デプロイに失敗させられるため）
      tableName: `${id}_DataTable`,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: false
    });
    dynamoDataTable.addLocalSecondaryIndex({
      indexName: `${id}_LSI_1`,
      sortKey: { name: "LSI_1", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });
    dynamoDataTable.addLocalSecondaryIndex({
      indexName: `${id}_LSI_2`,
      sortKey: { name: "LSI_2", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });
    dynamoDataTable.addLocalSecondaryIndex({
      indexName: `${id}_LSI_3`,
      sortKey: { name: "LSI_3", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });
    dynamoDataTable.addLocalSecondaryIndex({
      indexName: `${id}_LSI_4`,
      sortKey: { name: "LSI_4", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });
    dynamoDataTable.addLocalSecondaryIndex({
      indexName: `${id}_LSI_5`,
      sortKey: { name: "LSI_5", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    const dynamoSession = new Table(this, `${id}_SessionTable`, {
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      // セッションデータは削除されても問題ないが、Lambda@Edgeとの都合上、クロスリージョンを要するリソースであり、
      // かといって、S3のようにグローバルで一意な値を定義する必要があるわけでもないので、
      // ここは素直にテーブル名を明示する（PhysicalName.GENERATE_IF_NEEDED を使うのも手だが、テーブル名がややこしくなるので回避）
      tableName: `${id}_SessionTable`,
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
    const lambdaEdge = new experimental.EdgeFunction(this, `${id}_EdgeFunc`, {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("./nuxt3.output/server"),
      handler: "edge.handler",
      logRetention: RetentionDays.ONE_MONTH,
      timeout: Duration.seconds(30),
      memorySize: 2048,
      role: roleStack.lambdaEdgeRole,
    });
    // LambdaEdgeに割り当てているロールにインラインポリシーを追加
    dynamoDataTable.grantReadWriteData(lambdaEdge);
    dynamoSession.grantReadWriteData(lambdaEdge);
    
    /**
     * 前述の「PhysicalName.GENERATE_IF_NEEDED」を利用せず、
     * 単に bucketName: undefined とする形式でのバケット名自動生成を利用している場合に、
     * `dataBucket.grantReadWrite(lambdaEdge)` のようなコードを実行すると
     * 次のエラーが生じる。
     * 
     * ```
     * Resolution error:
     *   Cannot use resource 'XXXStack/XXXBucket'
     *   in a cross-environment fashion,
     *   the resource's physical name must be explicit set
     *   or use `PhysicalName.GENERATE_IF_NEEDED`.
     * ```
     * 
     * なおGENERATE_IF_NEEDEDを使わずとも、文字列で明示的にバケット名を
     * 定義している場合は、上記のエラーは生じない見込み。
     * 
     * (ただしS3バケットはグローバルで一意の名前をつけないといけないという制約がある)
     * 
     * ところで事前に明示的なロールを別スタックで用意していれば、
     * この時点で、S3バケットポリシーにも相応の適切なアクセス権限が付与される（ロールだけではなく）。
     * そのため、後で個別に addToResourcePolicy() を行う必要がない。
     */
    dataBucket.grantReadWrite(lambdaEdge);
    // </--------Lambda-------->

    // <--------CloudFront-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html

    // /**
    //  * CloudFrontWebDistribution は 2022年2月時点の情報によると
    //  * 近いうちに非推奨になるとのこと。
    //  * そういった経緯により、CloudFrontWebDistributionでは、
    //  * Cookieまわりの新しい推奨オプションであるところの
    //  * OriginRequestPolicyや、CachePolicyを用いた設定が実装されていない。
    //  * 
    //  * これに代わって推奨されるのは Distribution クラスとのこと。
    //  * そちらでは上記Cookie周りのオプションが対応している。
    //  */ 
    // const distribution = new CloudFrontWebDistribution(this, `${id}_CDN`, {
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
    //               forward: "all" // ただしキャッシュポリシーは、Distribution でないと使えない
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
    const distribution = new Distribution(this, `${id}_CDN`, {
      priceClass: PriceClass.PRICE_CLASS_200, // 価格クラス200以降は日本を含む
      defaultBehavior: {
        origin: appBucketOrigin,
        allowedMethods: AllowedMethods.ALLOW_ALL, //<= Lambda@EdgeはデフォルトでPOST等受け入れないので、受け入れるようにする
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
        originRequestPolicy: new OriginRequestPolicy(this, `${id}_DefaultBehaviorRequestPolicy`, {
          headerBehavior: OriginRequestHeaderBehavior.all(),
          cookieBehavior: OriginRequestCookieBehavior.all(),
          queryStringBehavior: OriginRequestQueryStringBehavior.all(),
        }),
        cachePolicy: new CachePolicy(this, `${id}_DefaultBehaviorCachePolicy`, {
          minTtl: Duration.seconds(10),
          defaultTtl: Duration.seconds(20),
          maxTtl: Duration.seconds(30),
          cookieBehavior: CacheCookieBehavior.all(),
          headerBehavior: CacheHeaderBehavior.none(),
          queryStringBehavior: CacheQueryStringBehavior.all()
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
          cachePolicy: new CachePolicy(this, `${id}_DataBucketCachePolicy`, {
            defaultTtl: Duration.days(30),
          }),
        },
        "/*.*": {
          origin: appBucketOrigin,
          cachePolicy: new CachePolicy(this, `${id}_Nuxt3AppBucketCachePolicy`, {
            minTtl: Duration.minutes(2),
            defaultTtl: Duration.minutes(4),
            maxTtl: Duration.minutes(5),
          }),
        },
      },
    });

    appBucket.addToResourcePolicy(new PolicyStatement({
      actions: ["s3:GetObject"],
      principals: [
        new CanonicalUserPrincipal(appOai.cloudFrontOriginAccessIdentityS3CanonicalUserId)
      ],
      resources: [`${appBucket.bucketArn}/*`]
    }));

    dataBucket.addToResourcePolicy(new PolicyStatement({
      actions: ["s3:GetObject"],
      principals: [
        new CanonicalUserPrincipal(dataOai.cloudFrontOriginAccessIdentityS3CanonicalUserId),
      ],
      resources: [`${dataBucket.bucketArn}/*`]
    }));
    // </--------CloudFront-------->

    // <--------Cognito-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito-readme.html
    const userPool = new UserPool(this, `${id}_UserPool`, {
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: {
        email: true,
      },
    });
    const userPoolClient = userPool.addClient(`${id}_app-userpool-client`, {
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
          `https://${distribution.distributionDomainName}`,
        ],
        logoutUrls: [
          'http://localhost:8000',
          'http://localhost:3000',
          `https://${distribution.distributionDomainName}`,
        ]
      }
    });
    const userPoolDomain = userPool.addDomain(`${id}_Domain`, {
      cognitoDomain: {
        domainPrefix: id.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-"),
      },
    });

    // ID Pool
    // const identityPool = new CfnIdentityPool(this, `${id}_IdentityPool`, {
    //   identityPoolName: id,
    //   allowUnauthenticatedIdentities: true,
    //   cognitoIdentityProviders: [
    //     {
    //       clientId: userPoolClient.userPoolClientId,
    //       providerName: `cognito-idp.ap-northeast-1.amazonaws.com/${userPool.userPoolId}`,
    //     },
    //   ],
    // });
    // const authenticatedRole = new Role(this, 'authRole', {
    //   assumedBy:
    //     new FederatedPrincipal("cognito-identity.amazonaws.com", {
    //   "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
    //   "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
    //     }),
    //   inlinePolicies: { 'policy': new PolicyDocument({
    //     statements: [
    //       new PolicyStatement({
    //         effect: Effect.ALLOW,
    //         actions: [
    //           "cognito-sync:*",
    //           "cognito-identity:*"
    //         ],
    //         resources: ["*"],
    //       })
    //     ]
    //   })},
    // });
    // new CfnIdentityPoolRoleAttachment(this, 'roleAttachment', {
    //   identityPoolId: identityPool.ref,
    //   roles: {
    //     "authenticated": authenticatedRole.roleArn,
    //   }
    // });

    const idPool = new L2IdentityPool(this, `${id}_IdentityPool`, {
      identityPoolName: id,
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: `cognito-idp.ap-northeast-1.amazonaws.com/${userPool.userPoolId}`,
        },
      ],
      authenticatedPolicyDocument: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "cognito-sync:*",
              "cognito-identity:*",
            ],
            resources: ["*"],
          }),
          // s3 dataBucket readwrite
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "s3:GetObject*",
              "s3:GetBucket*",
              "s3:List*",
              "s3:DeleteObject*",
              "s3:PutObject",
              "s3:PutObjectLegalHold",
              "s3:PutObjectRetention",
              "s3:PutObjectTagging",
              "s3:PutObjectVersionTagging",
              "s3:Abort*"
            ],
            resources: [
              `${dataBucket.bucketArn}/*`,
              `${dataBucket.bucketArn}`,
            ],
          }),
        ]
      }),
    });
    dataBucket.addToResourcePolicy(new PolicyStatement({
      actions: [
        "s3:GetObject*",
        "s3:GetBucket*",
        "s3:List*",
        "s3:DeleteObject*",
        "s3:PutObject",
        "s3:PutObjectLegalHold",
        "s3:PutObjectRetention",
        "s3:PutObjectTagging",
        "s3:PutObjectVersionTagging",
        "s3:Abort*"
      ],
      principals: [new ArnPrincipal(idPool.authenticatedRoleArn)],
      resources: [
        `${dataBucket.bucketArn}`,
        `${dataBucket.bucketArn}/*`
      ]
    }));
    // </--------Cognito-------->

    // <-------- Env for Nuxt3 -------->
    const AWS_REGION = this.region;
    const DYNAMO_DATA_TABLE = dynamoDataTable.tableName;
    const DYNAMO_SESSION_TABLE = dynamoSession.tableName;
    const S3_DATA_BUCKET = dataBucket.bucketName;
    const COGNITO_USER_POOL_ID = userPool.userPoolId;
    const COGNITO_CLIENT_ID = userPoolClient.userPoolClientId;
    const COGNITO_CLIENT_SECRET = "****************** (Get it from the management console.)";
    const COGNITO_REDIRECT_URL = `https://${distribution.distributionDomainName}`;
    const COGNITO_TOKEN_ENDPOINT = `${userPoolDomain.baseUrl()}/oauth2/token`
    const COGNITO_LOGIN_ENDPOINT = `${userPoolDomain.baseUrl()}/login`
    const COGNITO_LOGOUT_ENDPOINT = `${userPoolDomain.baseUrl()}/logout`

    // Nuxt3に定義すべき環境変数を出力
    // 必要に応じてNuxt3の再ビルドとデプロイを行なう
    // ※IDにアンダースコア使用不可なので、ハイフンで代替
    new CfnOutput(this, `AWS-REGION`, {value: AWS_REGION});
    new CfnOutput(this, `DYNAMO-DATA-TABLE`, {value: DYNAMO_DATA_TABLE});
    new CfnOutput(this, `DYNAMO-SESSION-TABLE`, {value: DYNAMO_SESSION_TABLE});
    new CfnOutput(this, `S3-DATA-BUCKET`, {value: S3_DATA_BUCKET});
    new CfnOutput(this, `COGNITO-USER-POOL-ID`, {value: COGNITO_USER_POOL_ID});
    new CfnOutput(this, `COGNITO-CLIENT-ID`, {value: COGNITO_CLIENT_ID});
    new CfnOutput(this, `COGNITO-CLIENT-SECRET`, {value: COGNITO_CLIENT_SECRET});
    new CfnOutput(this, `COGNITO-REDIRECT-URL`, {value: COGNITO_REDIRECT_URL});
    new CfnOutput(this, `COGNITO-TOKEN-ENDPOINT`, {value: COGNITO_TOKEN_ENDPOINT});
    new CfnOutput(this, `COGNITO-LOGIN-ENDPOINT`, {value: COGNITO_LOGIN_ENDPOINT});
    new CfnOutput(this, `COGNITO-LOGOUT-ENDPOINT`, {value: COGNITO_LOGOUT_ENDPOINT});
    // </-------- Env for Nuxt3 -------->
  }
}
