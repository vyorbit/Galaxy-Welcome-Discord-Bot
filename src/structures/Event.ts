/**
 * @file Event.ts
 * @organization VY ORBIT (https://vyorbit.com)
 * @copyright (c) VY ORBIT. All rights reserved.
 * @internal VYORBIT-STRUCT-EVENT
 */

import { ClientEvents } from 'discord.js';

export interface EventOptions<Key extends keyof ClientEvents> {
    name: Key;
    once?: boolean;
    execute: (...args: ClientEvents[Key]) => any;
}

export class Event<Key extends keyof ClientEvents> {
    constructor(public options: EventOptions<Key>) {}
}
