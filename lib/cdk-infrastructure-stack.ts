import * as cdk from "@aws-cdk/core";
import { Vpc } from "@aws-cdk/aws-ec2";
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

    console.log(clusterName);
    console.log(serviceName);
    console.log(assetFolder);

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

    // const taskDef = new ecs.TaskDefinition(this, assetFolder+"TaskDef", {
    //   compatibility: Compatibility.FARGATE,
    //   memoryMiB: "1024",
    //   cpu: "512"
    // });

    // taskDef.addContainer(assetFolder+"Container", {
    //   image: ecs.ContainerImage.fromAsset(assetFolder)
    // })

    // // Fargate service
    // const service = new ecs.FargateService(this, "infrastructureServiceId", {
    //     cluster: cluster,
    //     serviceName: serviceName,
    //     assignPublicIp: true,
    //     desiredCount: 1,
    //     taskDefinition: taskDef
    // });

    // // Health check
    // //service.targetGroup.configureHealthCheck({path: "/health"});

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "infrastructureServiceId", {
      cluster: cluster,
      serviceName: serviceName,
      memoryLimitMiB: 1024,
      cpu: 512,
      desiredCount: 1,
      taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(assetFolder),
      }
    });

    // Health check
    service.targetGroup.configureHealthCheck({path: "/health"});

    // Load balancer url
    new cdk.CfnOutput(this, "loadBalancedUrlId", {
        value: service.loadBalancer.loadBalancerDnsName,
        exportName: "loadBalancerUrl",
    });

  }
}
