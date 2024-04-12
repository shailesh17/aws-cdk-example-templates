TypeScript
import * as cdk from 'aws-cdk-lib';
import * as eks from '@aws-cdk-lib/aws-eks';
import * as iam from '@aws-cdk-lib/aws-iam';

interface EKSHelmDeploymentProps extends cdk.StackProps {
  cluster: eks.Cluster;
  image: string;
  repository: string;
  tag: string;
  chart: string;
  // Optional: Specify a Helm chart URL if hosted externally
  chartUrl?: string;
}

export class EKSHelmDeployment extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EKSHelmDeploymentProps) {
    super(scope, id, props);

    // IAM role for the Helm chart to access ECR
    const helmRole = new iam.Role(this, 'HelmRole', {
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
    });

    helmRole.addManagedPolicy(iam.ManagedPolicy.fromAwsPolicyName('AmazonECRContainerRegistryReadOnly'));

    const containerImage = ecs.ContainerImage.fromRegistry(`${props.image}/${props.repository}:${props.tag}`);

    // Grant the Helm role read access to the ECR repository
    containerImage.repository.grantRead(helmRole);

    // Helm chart object
    const chart = new eks.HelmChart(this, 'ExpressApp', {
      cluster: props.cluster,
      chart: props.chart,
      namespace: 'default',
      releaseName: 'express-app',
      values: {
        image: {
          repository: props.repository,
          tag: props.tag,
        },
      },
      // Optional: Specify a Helm chart URL if hosted externally
      repository: props.chartUrl,
    });
  }
}
