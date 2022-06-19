import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { CloudFrontAllowedMethods, CloudFrontWebDistribution, experimental, LambdaEdgeEventType, OriginAccessIdentity, PriceClass } from "aws-cdk-lib/aws-cloudfront";
import { AttributeType, BillingMode, ProjectionType, Table } from "aws-cdk-lib/aws-dynamodb";
import { ArnPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

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
    const appBucket = new Bucket(this, "quartzApp-PublicBucket", {
      removalPolicy: RemovalPolicy.DESTROY
    });
    new CfnOutput(this, "quartzApp-PublicBucket-Name", { value: appBucket.bucketName });
    const appOai = new OriginAccessIdentity(this, "quartzApp-OAI");
    appBucket.grantRead(appOai);
    new BucketDeployment(this, "quartzApp-PublicBucket-Deployment", {
      sources: [Source.asset("./nuxt3.output/public")],
      destinationBucket: appBucket
    });
    const dataBucket = new Bucket(this, "quartzData-PublicBucket", {
      removalPolicy: RemovalPolicy.RETAIN
    });
    const dataOai = new OriginAccessIdentity(this, "quartzData-OAI");
    dataBucket.grantRead(dataOai);
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
    // </--------DynamoDB-------->

    // <--------Lambda-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html
    /**
     * Lambda@Edgeなら、EdgeFunctionインスタンスでないと、スタック全体のリージョンとの差異がある場合にエラーになる。
     * ※ `Lambda@Edge`は us-east-1 リージョン限定（CloudFrontに紐づいているから）
     * 参考にさせていただいた記事：https://www.dkrk-blog.net/aws/lambda_edge_crossregion
     */
    const lambdaEdge = new experimental.EdgeFunction(this, "quartzEdgeHandler", {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./nuxt3.output/server"),
      handler: "edge.handler",
      logRetention: RetentionDays.ONE_MONTH,
      timeout: Duration.seconds(30),
      memorySize: 2048
    });
    dynamoTable.grantReadWriteData(lambdaEdge);

    /**
     * 直書き用ARNが手に入るまでは下記2点のaddToResourcePolicyをコメントアウトしてデプロイすべき。
     * なお、ここで必要としているARNは `Lambda@Edge` としてCloudFrontのビヘイビアに紐づいているLambdaのARNではなく、
     * そのLambdaに割り当てられているロールのARNである。
     * 
     * これは管理コンソールの us-east-1のLambdaの「アクセス権限」メニューからロールのページに飛び、
     * そこで参照することができる。
     */
    appBucket.addToResourcePolicy( //<= Lambda@EdgeのロールARNを取得したかったが、内包されたStackから参照できなかったのでARN直書き
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:GetObject"],
        principals: [new ArnPrincipal(
          "arn:aws:iam::904914921037:role/edge-lambda-stack-c82cecc-quartzEdgeHandlerService-13RGGZK18DR81"
        )],
        resources: [appBucket.bucketArn + "/*"]
      })
    );
    dataBucket.addToResourcePolicy( //<= Lambda@EdgeのロールARNを取得したかったが、内包されたStackから参照できなかったのでARN直書き
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:GetObject", "s3:PutObject"],
        principals: [new ArnPrincipal(
          "arn:aws:iam::904914921037:role/edge-lambda-stack-c82cecc-quartzEdgeHandlerService-13RGGZK18DR81"
        )],
        resources: [dataBucket.bucketArn + "/*"]
      })
    );
    // </--------Lambda-------->

    // <--------CloudFront-------->
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html
    const distribution = new CloudFrontWebDistribution(this, "quartzCdn", {
      priceClass: PriceClass.PRICE_CLASS_200, // 価格クラス200以降は日本を含む
      defaultRootObject: "", //<= defaultでは index.html になるが、不要なのであえて空文字にしておく
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: dataBucket,
            originAccessIdentity: dataOai
          },
          behaviors: [
            { // パターン的にこれが一番優先度高くなるよう定義しないと、ここに到達しないケースが生じる
              isDefaultBehavior: false,
              pathPattern: "/*/data.json",
              defaultTtl: Duration.minutes(5), //安定したらもっと長くてもOK
            }
          ]
        },
        {
          s3OriginSource: {
            s3BucketSource: appBucket,
            originAccessIdentity: appOai
          },
          behaviors: [
            {
              isDefaultBehavior: false,
              pathPattern: "/*.*",
              defaultTtl: Duration.seconds(240),
              minTtl: Duration.seconds(120),
              maxTtl: Duration.seconds(300),
            },
            {
              isDefaultBehavior: true,
              pathPattern: "*",
              defaultTtl: Duration.seconds(20),
              minTtl: Duration.seconds(10),
              maxTtl: Duration.seconds(30),
              lambdaFunctionAssociations: [
                {
                  eventType: LambdaEdgeEventType.ORIGIN_REQUEST, //<= 当初ﾋﾞｭｰｱﾘｸｴｽﾄで定義していたが、Lambda@Edgeサイズ制限にひっかかったのでORIGIN_REQUESTに変更
                  lambdaFunction: lambdaEdge.currentVersion,
                  includeBody: true //<= これがないと下記でPOST受け入れてもリクエストボディが届かない
                }
              ],
              allowedMethods: CloudFrontAllowedMethods.ALL, //<= Lambda@EdgeはデフォルトでPOST等受け入れないので、受け入れるようにする
              forwardedValues: { // <= QueryStringも設定しないと受け入れないので、設定する
                queryString: true,
                cookies: {
                  forward: "none" //<= 現状ではCookieを使っていないので拒絶
                }
              }
            }
          ]
        }

      ],
    });
    new CfnOutput(this, "CF URL", {
      value: `https://${distribution.distributionDomainName}`
    });
    // </--------CloudFront-------->
  }
}
