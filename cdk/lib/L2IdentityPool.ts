import { CfnIdentityPool, CfnIdentityPoolProps, CfnIdentityPoolRoleAttachment } from "aws-cdk-lib/aws-cognito";
import { Effect, PolicyDocument, PolicyStatement, Role, WebIdentityPrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface L2IdentityPoolProps extends CfnIdentityPoolProps {
  authenticatedPolicyDocument?: PolicyDocument,
  unauthenticatedPolicyDocument?: PolicyDocument,
}

/**
 * 参考：
 * https://qiita.com/tmokmss/items/2522e622a1bd55a2213c
 */
export class L2IdentityPool extends Construct {
  readonly pool: CfnIdentityPool;
  readonly identityPoolId: string;
  readonly authenticatedRoleArn: string;
  constructor(scope: Construct, id: string, props: L2IdentityPoolProps) {
    super(scope, id);
    const authenticatedPolicyDocument = props.authenticatedPolicyDocument ?? new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "cognito-sync:*",
            "cognito-identity:*",
          ],
          resources: ["*"],
        }),
      ]
    });
    const unauthenticatedPolicyDocument = props.unauthenticatedPolicyDocument ?? new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "cognito-sync:*",
          ],
          resources: ["*"],
        })
      ]
    });
    const identityPool = new CfnIdentityPool(this, 'identityPool', {
      ...props,
      allowUnauthenticatedIdentities: props.allowUnauthenticatedIdentities,
    })
    const authenticatedRole = new Role(this, 'authRole', {
      assumedBy:
        // FederatedPrincipal では "Action": "sts:AssumeRole" になってしまう。
        // これだと、Cognito User Pools を Provider にしてクレデンシャル取得を試みた時、
        // 「Invalid identity pool configuration. Check assigned IAM roles for this pool.」とエラーが出てしまう。
        // Action に割り当てるべきは「"sts:AssumeRoleWithWebIdentity"」なので、
        // WebIdentityPrincipal を使う。
        new WebIdentityPrincipal("cognito-identity.amazonaws.com", {
      "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
      "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
        }),
      inlinePolicies: { 'policy': authenticatedPolicyDocument },
    });
    this.authenticatedRoleArn = authenticatedRole.roleArn;
    const unauthenticatedRole = new Role(this, 'unauthRole', {
      assumedBy:
        new WebIdentityPrincipal("cognito-identity.amazonaws.com", {
      "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
      "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
        }),
      inlinePolicies: { 'policy': unauthenticatedPolicyDocument },
      });
    this.identityPoolId = identityPool.ref;
    new CfnIdentityPoolRoleAttachment(this, 'roleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        "authenticated": authenticatedRole.roleArn,
        "unauthenticated": unauthenticatedRole.roleArn,
      }
    })
  }
}
