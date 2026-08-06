import { ClusterManager } from 'discord-hybrid-sharding';
import { config } from 'dotenv';
import chalk from 'chalk';
import path from 'path';

config();

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error(chalk.red('[ERROR] BOT_TOKEN is missing in .env file.'));
    process.exit(1);
}

const manager = new ClusterManager(path.join(__dirname, 'bot.js'), {
    totalShards: 'auto', // Auto-scaling
    shardsPerClusters: 2,
    mode: 'process',
    token: token,
});

manager.on('clusterCreate', (cluster) => {
    console.log(chalk.cyan(`[Sharding] Launched Cluster ${cluster.id}`));
});

manager.spawn({ timeout: -1 }).catch((err) => {
    console.error(chalk.red('[Sharding ERROR] Failed to spawn clusters:'), err);
});
