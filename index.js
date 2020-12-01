const core = require('@actions/core');
const aws = require('aws-sdk');

async function run() {
    try {
        const ecs = new aws.ECS({
            customUserAgent: 'amazon-ecs-stop-task-for-github-actions'
        });

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

            core.debug(JSON.stringify(taskResult));

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