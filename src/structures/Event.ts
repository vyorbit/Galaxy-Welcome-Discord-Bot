import { ClientEvents } from 'discord.js';

export interface EventOptions<Key extends keyof ClientEvents> {
    name: Key;
    once?: boolean;
    execute: (...args: ClientEvents[Key]) => any;
}

export class Event<Key extends keyof ClientEvents> {
    constructor(public options: EventOptions<Key>) {}
}
