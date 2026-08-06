import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { GiveawayManager } from '../managers/GiveawayManager';

export class ExtendedClient extends Client {
    public cluster: ClusterClient<Client>;
    public commands: Collection<string, any> = new Collection();
    public events:   Collection<string, any> = new Collection();
    public giveawayManager!: GiveawayManager; // initialized in bot.ts

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildInvites,
            ],
            partials: [
                Partials.User,
                Partials.Message,
                Partials.GuildMember,
                Partials.ThreadMember,
                Partials.Reaction,
                Partials.Channel,
            ],
            shards:      getInfo().SHARD_LIST,
            shardCount:  getInfo().TOTAL_SHARDS,
        });

        this.cluster = new ClusterClient(this);
    }

    public async loadHandlers(): Promise<void> {
        console.log(chalk.blue('[Client] Loading handlers...'));

        // ── Events ────────────────────────────────────────────────────────────
        const eventsPath = path.join(__dirname, '..', 'events');
        if (fs.existsSync(eventsPath)) {
            for (const file of this.getAllFiles(eventsPath).filter(f => f.endsWith('.js'))) {
                try {
                    const event = (await import(file)).default;
                    if (event?.options?.name) {
                        if (event.options.once) {
                            this.once(event.options.name, (...args: any[]) => event.options.execute(...args));
                        } else {
                            this.on(event.options.name, (...args: any[]) => event.options.execute(...args));
                        }
                        this.events.set(event.options.name, event);
                    }
                } catch (err) {
                    console.error(chalk.red(`[Client] Failed to load event: ${path.basename(file)}`), err);
                }
            }
        }

        // ── Commands ──────────────────────────────────────────────────────────
        const commandsPath = path.join(__dirname, '..', 'commands');
        if (fs.existsSync(commandsPath)) {
            for (const file of this.getAllFiles(commandsPath).filter(f => f.endsWith('.js'))) {
                try {
                    const command = (await import(file)).default;
                    if (command?.data?.name) {
                        this.commands.set(command.data.name, command);
                    }
                } catch (err) {
                    console.error(chalk.red(`[Client] Failed to load command: ${path.basename(file)}`), err);
                }
            }
        }

        console.log(chalk.green(
            `[Client] Loaded — Commands: ${this.commands.size} | Events: ${this.events.size}`
        ));
    }

    private getAllFiles(dirPath: string, result: string[] = []): string[] {
        for (const file of fs.readdirSync(dirPath)) {
            const full = path.join(dirPath, file);
            if (fs.statSync(full).isDirectory()) {
                this.getAllFiles(full, result);
            } else {
                result.push(full);
            }
        }
        return result;
    }
}
