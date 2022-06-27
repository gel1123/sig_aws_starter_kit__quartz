#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import 'dotenv/config'

if (!process.env.AWS_ACCOUNT) {
  console.error(
    ".envファイルに、環境変数 AWS_ACCOUNT を定義して、デプロイ先のAWSアカウントIDを設定してください。\n"
    + "なお、下記のコマンドでAWSアカウントIDを確認できます。（PROFILE_NAMEに利用するプロファイル名を入力してください）\n"
    + "aws sts get-caller-identity --profile PROFILE_NAME"
  )
  throw Error("must set process.env.AWS_ACCOUNT");
}

if (!process.env.DEPLOY_MODE) {
  console.warn(
    ".envファイルに、環境変数 DEPLOY_MODE が定義されていません。\n"
    + "開発環境へのデプロイとみなし、デプロイを実行します。"
    + "（なお、商用環境へのデプロイを行う場合には、 DEPLOY_MODE=production を指定してください）"
  );
}

/**
 * デプロイするときのコマンド例：
 * npm run build && cdk deploy --all --profile PROFILE_NAME --require-approval never
 * 
 * --allオプションについては後述。
 * --require-approvalオプションは、承認を必要とするかどうかを決める。
 * neverを指定することで、 yes or no の選択肢なしでデプロイできる。
 */
const app = new cdk.App();

const projectCodeName = "QUARTZ";
const stackId = `${projectCodeName}-${
  process.env.DEPLOY_MODE === "production" ?
  "PROD" : "DEV"
}`;
new CdkStack(app, stackId, {env: {

  /**
   * aws sts get-caller-identity --profile PROFILE_NAME でアカウントIDを取得できる
   *
   * なお実行時環境変数を使うならこう
   * ```
   * AWS_ACCOUNT=$(node -e "console.log($(aws sts get-caller-identity --profile PROFILE_NAME).Account)") \
   * cdk deploy --all --profile PROFILE_NAME --require-approval never
   * ```
   */
  account: process.env.AWS_ACCOUNT,

  /**
   * `Lambda@Edge` を含むスタックをデプロイするときには、
   * スタックとしてのリージョンを明示する必要がある。
   * 
   * なおus-east-1以外のリージョンでデプロイするなら --all オプション付きデプロイが必要。
   * （Lambda@Edgeのインスタンスが内部でus-east-1のクロスリージョンスタックを生成した上でデプロイされるから）。
   */ 
  region: "ap-northeast-1"
}});
