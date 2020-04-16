/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import * as Crypto from "crypto";

export interface LiMessage<T = any> {
	id: string;
	timestamp: number;
	command: string;
	param: T;
}

export type LiMessageHandler = (message: LiMessage) => void;

export class LiMessageManager {

	private messages: Map<string, LiMessageHandler>;

	public constructor() {

		this.messages = new Map<string, LiMessageHandler>();

	}

	public generateId(handler: LiMessageHandler): string {

		let id: string = Crypto.randomBytes(16).toString("hex");
		while (this.messages.has(id)) id = Crypto.randomBytes(16).toString("hex");
		this.messages.set(id, handler);

		return id;

	}

	public getHandler(id: string): LiMessageHandler | undefined {

		return this.messages.get(id);

	}

}