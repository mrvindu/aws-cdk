import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import { ManagedPolicy } from '@aws-cdk/aws-iam';
import * as iam from '@aws-cdk/aws-iam';
import { Role } from '@aws-cdk/aws-iam';
import { Duration, Fn, CfnOutput } from '@aws-cdk/core';
import { Vpc, SecurityGroup, CfnEC2Fleet, CfnSecurityGroupIngressProps } from '@aws-cdk/aws-ec2';
import * as ec2 from '@aws-cdk/aws-ec2';
import { Alarm } from '@aws-cdk/aws-cloudwatch';

export class OmsReportsStack extends cdk.Stack {
   constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
   super(scope, id, props);

    //import existing internal services vpc
    const externalVpc = Vpc.fromVpcAttributes(this, 'VPC', {
      vpcId: Fn.importValue('InternalServicesVPCID'),
      availabilityZones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
      privateSubnetIds: [
        Fn.importValue('InternalServicesSubnetPrivate1a'),
        Fn.importValue('InternalServicesSubnetPrivate1b'),
        Fn.importValue('InternalServicesSubnetPrivate1c'),
      ],
    });
    //security group for OMS-Reports
    const LambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: externalVpc,
      description: "OMS-Reports",
      securityGroupName: "OMS-Reports-Function"
    });
    LambdaSecurityGroup.addIngressRule(ec2.Peer.ipv4(Fn.importValue('InternalServicesIPv4CIDRBlock')), ec2.Port.tcp(80), "VPC HTTP Access");
    LambdaSecurityGroup.addEgressRule(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.allTraffic());
    
    //IamRoles for OMS-Reports
    const myRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal ('lambda.amazonaws.com'),
      roleName: 'IamRoleOMS-Reports-UnknownReturnsReport-cdk'
    });
    myRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    myRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaENIManagementAccess")); 
    myRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AWSXrayWriteOnlyAccess")); 

    //Functions for OMS-Reports
    const OMSReportsUnknownReturnsReportcdk = new lambda.Function(this, 'MyFunction', {
      functionName: "OMS-Reports-UnknownReturnsReport-cdk",
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 128,
      timeout: Duration.seconds(3),
      vpc: externalVpc,
      description: 'OMS Reports',
      role: myRole,
      securityGroup: LambdaSecurityGroup,
      environment: {
        BUCKET_NAME: "plt-staging.finance-reporting",
      }
    });
    const rule = new events.Rule(this, 'Rule', {
      schedule: events.Schedule.expression('cron(0 0 * * ? *)')
    });
    rule.addTarget(new targets.LambdaFunction(OMSReportsUnknownReturnsReportcdk));
   
    //CloudWatchAlarms
    const AliasErrorMetricGreaterThanZeroAlarm = new  

       
  }
}
