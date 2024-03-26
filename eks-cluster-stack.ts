import * as eks from '@aws-cdk/aws-eks';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';

export class EksClusterStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC for the EKS Cluster
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2 // Adjust as needed
    });

    // Create EKS Cluster
    const cluster = new eks.Cluster(this, 'MyCluster', {
      vpc,
      defaultCapacity: 2, // Number of worker nodes
      outputClusterName: true // Output cluster name as stack output
    });

    // Add IAM roles for the EKS cluster
    const eksRole = new iam.Role(this, 'EksClusterRole', {
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com')
    });

    // Attach policies to the EKS cluster role
    eksRole.addToPolicy(new iam.PolicyStatement({
      actions: ['eks:DescribeCluster'],
      resources: [cluster.clusterArn]
    }));

    // Attach the role to the EKS cluster
    cluster.awsAuth.addRoleMapping(eksRole);

    // Add a node group to the cluster
    const nodeGroup = cluster.addNodegroupCapacity('MyNodeGroup', {
      instanceType: new ec2.InstanceType('t3.medium'),
      minSize: 1,
      maxSize: 10,
      nodeRole: eksRole // Use the role for the node group
    });

    // Output the kubeconfig for connecting to the cluster
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName
    });

    new cdk.CfnOutput(this, 'ClusterCertificateAuthorityData', {
      value: cluster.clusterCertificateAuthorityData
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: cluster.clusterEndpoint
    });

    // Deploy an Alpine Linux instance as a pod
    const alpinePodManifest = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'alpine-pod' },
      spec: {
        containers: [{
          name: 'alpine',
          image: 'alpine',
          command: ['sh', '-c', 'echo Hello from Alpine && sleep 3600']
        }]
      }
    };

    // Add the pod to the cluster
    cluster.addManifest('alpine-pod', alpinePodManifest);
  }
}

const app = new cdk.App();
new EksClusterStack(app, 'EksClusterStack');
