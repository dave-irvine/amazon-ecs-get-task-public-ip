const core = require('@actions/core');
const aws = require('aws-sdk');

/**
 * 
 * @param { AWS.ECS.Attachments } attachments
 */
const getENI = (attachments) => {
    const attachment = attachments[0];

    const networkInterfaceIdDetail = attachment.details.find((detail) => {
        return detail.name === 'networkInterfaceId';
    });

    return networkInterfaceIdDetail.value;
}

/**
 * 
 * @param { AWS.EC2.NetworkInterfaceList } networkInterfaces
 */
const getPublicIP = (networkInterfaces) => {
    const interface = networkInterfaces[0];

    return interface.Association.PublicIp;
}

async function run() {
    try {
        const ecs = new aws.ECS({
            customUserAgent: 'amazon-ecs-get-task-public-ip-for-github-actions'
        });

        const ec2 = new aws.EC2({
            customUserAgent: 'amazon-ecs-get-task-public-ip-for-github-actions'
        })

        // Get inputs
        const task = core.getInput('task-arn', { required: true });
        const cluster = core.getInput('cluster', { required: false });

        try {
            const result = await ecs.describeTasks({
                cluster,
                tasks: [ task ]
            }).promise();

            if (result.tasks.length !== 1) {
                throw new Error("No task found, or multiple tasks with the same ARN");
            }

            const taskResult = result.tasks[0];

            const eni = getENI(taskResult.attachments);

            const eniResult = await ec2.describeNetworkInterfaces({
                NetworkInterfaceIds: [ eni ]
            }).promise();

            const publicIP = getPublicIP(eniResult.NetworkInterfaces);

            core.setOutput("public-ip", publicIP);
        } catch (error) {
            core.setFailed("Failed to stop task in ECS: " + error.message);
            throw (error);
        }
    }
    catch (error) {
        core.setFailed(error.message);
        core.debug(error.stack);
    }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
    run();
}