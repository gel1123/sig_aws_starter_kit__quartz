#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

/**
 * デプロイするときのコマンド例：
 * npm run build && cdk deploy --all --profile studying --require-approval never
 * 
 * --allオプションについては後述。
 * --require-approvalオプションは、承認を必要とするかどうかを決める。
 * neverを指定することで、 yes or no の選択肢なしでデプロイできる。
 */
const app = new cdk.App();

/**
 * `Lambda@Edge` を含むスタックをデプロイするときには、
 * スタックとしてのリージョンを明示する必要がある。
 * 
 * なおus-east-1以外のリージョンでデプロイするなら --all オプション付きデプロイが必要。
 * （Lambda@Edgeのインスタンスが内部でus-east-1のクロスリージョンスタックを生成した上でデプロイされるから）。
 * 
 * 初期は us-east-1 リージョンでまとめて全部デプロイしていたが、
 * CCHの制作が進むにつれ、DynamoDBなどus-east-1ではなくap-northeast-1リージョンに作成したいものが
 * 増えたため、現在では ap-northeast-1 リージョンでクロスリージョンデプロイしている。
 */ 
new CdkStack(app, 'QuartzStack', {env: {
  // 実行時環境変数を使うならこう
  // AWS_ACCOUNT=$(node -e "console.log($(aws sts get-caller-identity --profile studying).Account)") cdk deploy --all --profile studying --require-approval never
  account: "904914921037",
  region: "ap-northeast-1"
}});
