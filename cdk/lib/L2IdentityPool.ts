import { CfnIdentityPool, CfnIdentityPoolProps, CfnIdentityPoolRoleAttachment } from "aws-cdk-lib/aws-cognito";
import { Effect, FederatedPrincipal, PolicyDocument, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
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
        new FederatedPrincipal("cognito-identity.amazonaws.com", {
      "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
      "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
        }),
      inlinePolicies: { 'policy': authenticatedPolicyDocument },
    });
    this.authenticatedRoleArn = authenticatedRole.roleArn;
    const unauthenticatedRole = new Role(this, 'unauthRole', {
      assumedBy:
        new FederatedPrincipal("cognito-identity.amazonaws.com", {
      "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
      "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
        }),
      inlinePolicies: { 'policy': unauthenticatedPolicyDocument },
      });
    new CfnIdentityPoolRoleAttachment(this, 'roleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        "authenticated": authenticatedRole.roleArn,
        "unauthenticated": unauthenticatedRole.roleArn,
      }
    })
  }
}
