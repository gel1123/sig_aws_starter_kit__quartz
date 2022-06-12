import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito-readme.html
    const userPool = new cognito.UserPool(this, 'quartz_userpool', {
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
      },
    });
    userPool.addDomain('quartz_app-userpool-domain', {
      cognitoDomain: {
        domainPrefix: 'quartz',
      },
    });
    userPool.addResourceServer('quartz_app-userpool-resource-server', {
      identifier: 'localhost',
      scopes: [new cognito.ResourceServerScope({
        scopeName: 'read',
        scopeDescription: 'Read access to the app',
      })]
    });
  }
}
