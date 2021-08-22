import * as cdk from "@aws-cdk/core";
import { Vpc, SecurityGroup, Port, Peer } from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecr from "@aws-cdk/aws-ecr";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import { Compatibility } from "@aws-cdk/aws-ecs";

export class CdkInfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CLI context input
    const clusterName = this.node.tryGetContext('clusterName');
    const serviceName = this.node.tryGetContext('serviceName');
    const assetFolder = this.node.tryGetContext('assetFolder');

    const port: number = this.node.tryGetContext('port') || 80;
    const memoryLimitMiB: number = this.node.tryGetContext('memoryLimitMiB') || 1024;
    const cpu: number = this.node.tryGetContext('cpu') || 256;

    // VPC
    const vpc = new Vpc(this, "infrastructureVpcId", {
      maxAzs: 2,
      natGateways: 1
    });

      // Cluster
      const cluster = new ecs.Cluster(this, "infrastructureClusterId", {
          clusterName: clusterName,
          vpc: vpc as any,
      });

      const taskDef = new ecs.FargateTaskDefinition(this, assetFolder+"TaskDef", {
        memoryLimitMiB: memoryLimitMiB,
        cpu: cpu
      });

      taskDef.addContainer(assetFolder+"Container", {
        image: ecs.ContainerImage.fromAsset(assetFolder)
      });

      const mySecurityGroup = new SecurityGroup(this, 'SecurityGroup', {
        vpc,
        description: 'Allow port connection to ec2 instances',
        allowAllOutbound: true,   // Can be set to false
      });
      mySecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(port), `Allows the Internet to send requests to the app via port ${port}`);

      // Fargate service
      const service = new ecs.FargateService(this, "infrastructureServiceId", {
          cluster: cluster,
          serviceName: serviceName,
          assignPublicIp: true,
          desiredCount: 1,
          taskDefinition: taskDef,
          securityGroups: [mySecurityGroup]
      });

    // //const featchedService = ecs.FargateService.fromFargateServiceArn(this, "fetchedFargateService", "arn:aws:ecs:us-east-2:571374152725:service/psgen-cluster/psgen-service-20-08-21");
    
    // // Health check
    // //service.targetGroup.configureHealthCheck({path: "/health"});




    // const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "infrastructureServiceId", {
    //   cluster: cluster,
    //   serviceName: serviceName,
    //   memoryLimitMiB: 1024,
    //   cpu: 256,
    //   desiredCount: 1,
    //   taskImageOptions: {
    //       image: ecs.ContainerImage.fromAsset(assetFolder),
    //   }
    // });

    // // Health check
    // service.targetGroup.configureHealthCheck({path: "/health"});

    // // Load balancer url
    // new cdk.CfnOutput(this, "loadBalancedUrlId", {
    //     value: service.loadBalancer.loadBalancerDnsName,
    //     exportName: "loadBalancerUrl",
    // });

  }
}
