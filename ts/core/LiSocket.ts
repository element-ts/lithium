/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {PromReject, PromResolve} from "@elijahjcobb/prom-type";
import {BetterJSON} from "@elijahjcobb/better-json";
import {LiMessage, LiMessageHandler, LiMessageManager} from "./LiMessageManager";
import {Neon} from "@element-ts/neon";
import {OObjectType, OOptional, OStandardType, OAny} from "@element-ts/oxygen";
import {
	LiCommandHandlerParam,
	LiCommandHandlerReturnPromisified,
	LiCommandHandlerStructure,
	LiCommandName,
	LiCommandRegistry,
	LiCommandRegistryMapValue,
	LiCommandRegistryStructure
} from "./LiCommandRegistry";

export interface SocketAble {
	close(): void;
	send(data: string, handler: (err?: Error) => void): void;
	onMessage(handler: (data: any) => void): void;
	onClose(handler: (code?: number, reason?: string) => void): void;
	onError(handler: (err: Error) => void): void;
}

export class LiSocket<
	LC extends LiCommandRegistryStructure<LC>,
	RC extends LiCommandRegistryStructure<RC>,
	SC extends LiCommandRegistryStructure<SC> = any
	> {

	private socket: SocketAble;
	private id: string;
	private isConnected: boolean = true;
	private readonly didReceiveId: (() => void) | undefined;
	private readonly allowPeerToPeer: boolean;

	protected commandRegistry: LiCommandRegistry<LC>;
	protected messageManager: LiMessageManager;

	public onClose: ((code?: number, reason?: string) => void) | undefined;
	public onError: ((error: Error) => void) | undefined;

	public static logger: Neon = new Neon();

	public constructor(socket: SocketAble, commandRegistry?: LiCommandRegistry<LC>, id: string = "", onDidReceiveId: ((() => void) | undefined) = undefined, allowPeerToPeer: boolean = false, debug?: boolean) {

		this.id = id;
		this.socket = socket;

		this.commandRegistry = commandRegistry || new LiCommandRegistry<LC>();
		this.messageManager = new LiMessageManager();
		this.didReceiveId = onDidReceiveId;
		this.allowPeerToPeer = allowPeerToPeer;

		this.onMessage = this.onMessage.bind(this);
		this.socket.onMessage(this.onMessage);

		this.handleOnClose = this.handleOnClose.bind(this);
		this.socket.onClose(this.handleOnClose);

		this.handleOnError = this.handleOnError.bind(this);
		this.socket.onError(this.handleOnError);

		if (debug) {
			LiSocket.logger.enable();
			LiSocket.logger.setTitle("@element-ts/lithium LiSocket");
		}

		if (this.id !== "") {

			LiSocket.logger.log("Will send id to socket.");

			this.send({
				timestamp: Date.now(),
				command: "id",
				param: this.id,
				id: this.id,
				peerToPeer: false
			})
				.then((): void => LiSocket.logger.log("Did send id to socket."))
				.catch((err: any): void => LiSocket.logger.err(err));
		}

	}

	private send<T = any>(message: LiMessage<T>): Promise<void> {
		return new Promise<void>((resolve: PromResolve<void>, reject: PromReject): void => {

			if (!this.isConnected) return resolve();

			const messageString: string = BetterJSON.stringify(message);

			LiSocket.logger.log(`Will send message (${message.id}): '${messageString}'.`);

			this.socket.send(messageString, (err?: Error): void => {

				if (err) return reject(err);
				LiSocket.logger.log(`Did send message (${message.id}).`);
				resolve();

			});

		});
	}

	private async onMessage(data: any): Promise<void> {

		if (typeof data !== "string") {
			LiSocket.logger.err("LiSocket.onMessage(): Data received was not an instance of string.");
			return;
		}

		LiSocket.logger.log(`Did receive message (${data.length.toLocaleString()} bytes).`);

		let message: LiMessage;

		try {
			message = BetterJSON.parse(data);
		} catch (e) {
			LiSocket.logger.err("LiSocket.onMessage(): Data received was able to parse to JSON.");
			return;
		}

		const requiredType = OObjectType.follow({
			timestamp: OStandardType.number,
			command: OStandardType.string,
			id: OStandardType.string,
			param: OOptional.maybe(OAny.any()),
			peerToPeer: OStandardType.boolean
		});

		LiSocket.logger.log(`Did parse message (${message.id}) -> '${data}'.`);

		const isValid: boolean = requiredType.conforms(message);

		if (!isValid) {
			LiSocket.logger.err(message);
			LiSocket.logger.err("LiSocket.onMessage(): Data received did not conform to lithium message types.");
			return;
		}

		const command: string = message.command;

		if (command === "return" || command === "error" || command === "id") return this.handleOnReturn(message);

		LiSocket.logger.log(`Looking for handler for message (${message.id}).`);
		const handlerItem: LiCommandRegistryMapValue | undefined = this.commandRegistry.getHandlerForCommand(command);


		if (handlerItem === undefined) {

			await this.send({
				timestamp: message.timestamp,
				command: "error",
				param: new Error("Command does not exist."),
				id: message.id,
				peerToPeer: false
			});
			LiSocket.logger.err("LiSocket.onMessage(): Command not found.");
			return;
		}

		LiSocket.logger.log(`Found handler for message (${message.id}).`);

		if (message.peerToPeer && (!handlerItem.allowPeerToPeer || !this.allowPeerToPeer)) {

			LiSocket.logger.log(`Command '${command}' does not allow peer to peer and it was a peer to peer message.`);

			return await this.send({
				timestamp: message.timestamp,
				command: "error",
				param: "You tried to invoke a peer-to-peer command but the sibling you invoked it on does not allow peer-to-peer for this command.",
				id: message.id,
				peerToPeer: false
			});

		}

		const param: any = message.param;

		try {

			const returnValue: any = await handlerItem.handler(param, this);

			await this.send({
				timestamp: message.timestamp,
				command: "return",
				param: returnValue,
				id: message.id,
				peerToPeer: false
			});

		} catch (e) {

			LiSocket.logger.err(e);

			let formattedError: any = e;
			if (e instanceof Error) formattedError = { error: e.message };

			await this.send({
				timestamp: message.timestamp,
				command: "error",
				param: formattedError,
				id: message.id,
				peerToPeer: false
			});

		}

	}

	private async handleOnReturn(message: LiMessage): Promise<void> {

		LiSocket.logger.log(`Message (${message.id}) is a response.`);

		if (message.command === "id") {
			LiSocket.logger.log("Message is incoming id from server.");
			this.id = message.param;
			if (this.didReceiveId) this.didReceiveId();
			return ;
		}

		const handler: LiMessageHandler | undefined = this.messageManager.getHandler(message.id);
		if (handler === undefined) {
			LiSocket.logger.err("LiSocket.handleOnReturn(): Handler not found for message id.");
			return;
		}

		handler(message);

	}

	private handleOnClose(code?: number, reason?: string): void {

		LiSocket.logger.log(`Connection did close with code '${code}' and message '${reason}'.`);
		this.isConnected = false;
		if (this.onClose) this.onClose(code, reason);

	}

	private handleOnError(err: Error): void {

		LiSocket.logger.err(`Connection receive error: ${err.name} '${err.message}'`);

		if (this.onError) this.onError(err);

	}

	public implementSibling<C extends LiCommandName<SC>>(command: C, handler: LiCommandHandlerStructure<SC, RC, C>): void {

		// @ts-ignore
		this.implement(command, handler, true);

	}

	public implement<C extends LiCommandName<LC>>(command: C, handler: LiCommandHandlerStructure<LC, RC, C>, allowPeerToPeer: boolean = false): void {

		if (command === "return" || command === "error") {
			throw new Error(
				"You cannot implement the 'return' or 'error' command as these commands are required for" +
				"internal communication."
			);
		}

		this.commandRegistry.implement(command, handler, allowPeerToPeer);

	}

	public invoke<C extends LiCommandName<RC>>(command: C, param: LiCommandHandlerParam<RC, C>, peerToPeer: boolean = false): LiCommandHandlerReturnPromisified<RC, C> {
		return new Promise((resolve: PromResolve<any>, reject: PromReject): void => {

			const handler: (message: LiMessage) => void = (message: LiMessage): void => {

				if (message.command === "return") resolve(message.param);
				else reject(message.param);

			};

			const id: string = this.messageManager.generateId(handler);

			this.send({
				id,
				command,
				param,
				timestamp: Date.now(),
				peerToPeer
			}).catch((err: any): void => {

				console.error("LiSocket.invoke:send Failed to send.");
				console.error(err);

			});

		});
	}

	public getId(): string { return this.id; }

	public async close(): Promise<void> {

		this.socket.close();
		this.handleOnClose();

	}

}