/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import * as WS from "ws";
import {StandardType, ObjectType, SpecialType, OptionalType} from "typit";
import {PromReject, PromResolve} from "@elijahjcobb/prom-type";
import {BetterJSON} from "@elijahjcobb/better-json";
import {LiMessage, LiMessageHandler, LiMessageManager} from "./LiMessageManager";
import {LiLogger} from "./LiLogger";
import {
	LiCommandHandlerParam,
	LiCommandHandlerReturnPromisified,
	LiCommandHandlerStructure,
	LiCommandName,
	LiCommandRegistry,
	LiCommandRegistryMapValue,
	LiCommandRegistryStructure
} from "./LiCommandRegistry";

export class LiBaseSocket<
	LC extends LiCommandRegistryStructure<LC>,
	RC extends LiCommandRegistryStructure<RC>,
	SC extends LiCommandRegistryStructure<SC> = any
> {

	private id: string;
	private isConnected: boolean = true;
	private readonly didReceiveId: (() => void) | undefined;
	private readonly allowPeerToPeer: boolean;

	protected commandRegistry: LiCommandRegistry<LC>;
	protected messageManager: LiMessageManager;
	protected socket: WS;

	public onClose: ((code?: number, reason?: string) => void) | undefined;
	public onError: ((error: Error) => void) | undefined;

	public constructor(socket: WS, commandRegistry?: LiCommandRegistry<LC>, id: string = "", onDidReceiveId: ((() => void) | undefined) = undefined, allowPeerToPeer: boolean = false) {

		this.id = id;
		this.socket = socket;
		this.commandRegistry = commandRegistry || new LiCommandRegistry<LC>();
		this.messageManager = new LiMessageManager();
		this.didReceiveId = onDidReceiveId;
		this.allowPeerToPeer = allowPeerToPeer;

		this.onMessage = this.onMessage.bind(this);
		this.socket.on("message", this.onMessage);

		this.handleOnClose = this.handleOnClose.bind(this);
		this.socket.on("close", this.handleOnClose);

		this.handleOnError = this.handleOnError.bind(this);
		this.socket.on("error", this.handleOnError);

		if (this.id !== "") {

			LiLogger.log("Will send id to socket.");

			this.send({
				timestamp: Date.now(),
				command: "id",
				param: this.id,
				id: this.id,
				peerToPeer: false
			})
				.then((): void => LiLogger.log("Did send id to socket."))
				.catch((err: any): void => LiLogger.error(err));
		}

	}

	private send<T = any>(message: LiMessage<T>): Promise<void> {
		return new Promise<void>((resolve: PromResolve<void>, reject: PromReject): void => {

			if (!this.isConnected) return resolve();

			const messageString: string = BetterJSON.stringify(message);
			const messageData: Buffer = Buffer.from(messageString);

			LiLogger.log(`Will send message (${message.id}): '${messageString}'.`);

			this.socket.send(messageData, (err?: Error): void => {

				if (err) return reject(err);
				LiLogger.log(`Did send message (${message.id}).`);
				resolve();

			});

		});
	}

	private async onMessage(data: WS.Data): Promise<void> {

		if (!(data instanceof Buffer)) {
			LiLogger.error("LiBaseSocket.onMessage(): Data received was not an instance of Buffer.");
			return;
		}

		LiLogger.log(`Did receive message (${data.length.toLocaleString()} bytes).`);

		const dataAsString: string = data.toString("utf8");
		let message: LiMessage;

		try {
			message = BetterJSON.parse(dataAsString);
		} catch (e) {
			LiLogger.error("LiBaseSocket.onMessage(): Data received was able to parse to JSON.");
			return;
		}

		const requiredType: ObjectType = new ObjectType({
			timestamp: StandardType.NUMBER,
			command: StandardType.STRING,
			id: StandardType.STRING,
			param: new OptionalType(SpecialType.ANY),
			peerToPeer: StandardType.BOOLEAN
		});

		LiLogger.log(`Did parse message (${message.id}) -> '${dataAsString}'.`);

		const isValid: boolean = requiredType.checkConformity(message);

		if (!isValid) {
			console.error(message);
			console.error("LiBaseSocket.onMessage(): Data received did not conform to lithium message types.");
			return;
		}

		const command: string = message.command;

		if (command === "return" || command === "error" || command === "id") return this.handleOnReturn(message);

		LiLogger.log(`Looking for handler for message (${message.id}).`);
		const handlerItem: LiCommandRegistryMapValue | undefined = this.commandRegistry.getHandlerForCommand(command);


		if (handlerItem === undefined) {

			await this.send({
				timestamp: message.timestamp,
				command: "error",
				param: new Error("Command does not exist."),
				id: message.id,
				peerToPeer: false
			});
			LiLogger.error("LiBaseSocket.onMessage(): Command not found.");
			return;
		}

		LiLogger.log(`Found handler for message (${message.id}).`);

		if (message.peerToPeer && (!handlerItem.allowPeerToPeer || !this.allowPeerToPeer)) {

			LiLogger.log(`Command '${command}' does not allow peer to peer and it was a peer to peer message.`);

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

			LiLogger.error(e);

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

		LiLogger.log(`Message (${message.id}) is a response.`);

		if (message.command === "id") {
			LiLogger.log("Message is incoming id from server.");
			this.id = message.param;
			if (this.didReceiveId) this.didReceiveId();
			return ;
		}

		const handler: LiMessageHandler | undefined = this.messageManager.getHandler(message.id);
		if (handler === undefined) {
			LiLogger.error("LiBaseSocket.handleOnReturn(): Handler not found for message id.");
			return;
		}

		handler(message);

	}

	private handleOnClose(code?: number, reason?: string): void {

		LiLogger.log(`Connection did close with code '${code}' and message '${reason}'.`);
		this.isConnected = false;
		if (this.onClose) this.onClose(code, reason);

	}

	private handleOnError(err: Error): void {

		LiLogger.error(`Connection receive error: ${err.name} '${err.message}'`);

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

				console.error("LiBaseSocket.invoke:send Failed to send.");
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