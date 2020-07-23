/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

export interface LiMessage<T = any> {
	id: string;
	timestamp: number;
	command: string;
	param: T;
	peerToPeer: boolean;
}

export type LiMessageHandler = (message: LiMessage) => void;

export class LiMessageManager {

	private messages: Map<string, LiMessageHandler>;

	public constructor() {

		this.messages = new Map<string, LiMessageHandler>();

	}

	public generateId(handler: LiMessageHandler): string {

		let id: string = LiMessageManager.randomId();
		while (this.messages.has(id)) id = LiMessageManager.randomId();
		this.messages.set(id, handler);

		return id;

	}

	public getHandler(id: string): LiMessageHandler | undefined {

		return this.messages.get(id);

	}

	private static randomId(length: number = 16): string {

		let result = "";
		const options = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < length; i++) result += options[Math.floor(Math.random() * options.length)];

		return result;

	}


}