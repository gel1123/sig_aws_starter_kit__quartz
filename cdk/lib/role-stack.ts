import { Stack, StackProps } from "aws-cdk-lib";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class RoleStack extends Stack {

  public readonly lambdaEdgeRole: Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * メインスタックでS3バケットへの addToResourcePolicy() で LambdaEdge に割り当てたRoleのARNが
     * 必要であり、EdgeFunctionの暗黙的なロール生成ケースでは、
     * ARNをCDK deploy 実行時に取得できないので、
     * このようにして明示的にロールを生成している。
     * 
     * なおメインスタックで new Role() し、edgeFunction に渡すと、
     * 循環参照エラーが生じてしまう。
     * 
     * （関連Issue: ）
     * 
     * これを解消するために、グローバルリソースであるところのIAMロールを、
     * 独立した本スタックにて定義し、その後で edgeFunction が生成する暗黙的なスタックと、
     * メインスタックを生成している。
     */
    const lambdaEdgeRole = new Role(this, "QuartzOperateS3Role", {
      roleName: "quartzLambdaEdgeRole",
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ]
    });
    this.lambdaEdgeRole = lambdaEdgeRole;
  }
}
