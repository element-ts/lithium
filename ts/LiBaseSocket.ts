/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import WS from "ws";
import {StandardType, ObjectType, SpecialType, OptionalType} from "typit";
import {PromReject, PromResolve} from "@elijahjcobb/prom-type";


import {
	LiCommandHandler,
	LiCommandHandlerParam, LiCommandHandlerReturn,
	LiCommandHandlerStructure,
	LiCommandName,
	LiCommandRegistry,
	LiCommandRegistryStructure
} from "./LiCommandRegistry";
import {LiMessage, LiMessageHandler, LiMessageManager} from "./LiMessageManager";
import {LiLogger} from "./LiLogger";

export class LiBaseSocket<
	LocalCommands extends LiCommandRegistryStructure,
	RemoteCommands extends LiCommandRegistryStructure
	> {

	protected commandRegistry: LiCommandRegistry<LocalCommands>;
	protected messageManager: LiMessageManager;
	protected socket: WS;
	public readonly id: string;

	public constructor(socket: WS, commandRegistry?: LiCommandRegistry<LocalCommands>, id: string = "") {

		this.id = id;
		this.commandRegistry = commandRegistry || new LiCommandRegistry<LocalCommands>();
		this.messageManager = new LiMessageManager();
		this.socket = socket;

		this.onMessage = this.onMessage.bind(this);
		this.socket.on("message", this.onMessage);

	}

	private send<T = any>(message: LiMessage<T>): Promise<void> {
		return new Promise<void>((resolve: PromResolve<void>, reject: PromReject): void => {

			const messageString: string = JSON.stringify(message);
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
			message = JSON.parse(dataAsString);
		} catch (e) {
			LiLogger.error("LiBaseSocket.onMessage(): Data received was able to parse to JSON.");
			return;
		}

		const requiredType: ObjectType = new ObjectType({
			timestamp: StandardType.NUMBER,
			command: StandardType.STRING,
			id: StandardType.STRING,
			param: new OptionalType(SpecialType.ANY)
		});

		LiLogger.log(`Did parse message (${message.id}) -> '${dataAsString}'.`);

		const isValid: boolean = requiredType.checkConformity(message);

		if (!isValid) {
			console.error(message);
			console.error("LiBaseSocket.onMessage(): Data received did not conform to lithium message types.");
			return;
		}

		const commend: string = message.command;

		if (commend === "return" || commend === "error") return this.handleOnReturn(message);

		LiLogger.log(`Looking for handler for message (${message.id}).`);
		const handler: LiCommandHandler | undefined = this.commandRegistry.getHandlerForCommand(commend);

		if (handler === undefined) {

			await this.send({
				timestamp: message.timestamp,
				command: "error",
				param: new Error("Command does not exist."),
				id: message.id
			});
			LiLogger.error("LiBaseSocket.onMessage(): Command not found.");
			return;
		}

		LiLogger.log(`Found handler for message (${message.id}).`);

		const param: any = message.param;
		const returnValue: any = await handler(param, this);

		await this.send({
			timestamp: message.timestamp,
			command: "return",
			param: returnValue,
			id: message.id
		});

	}

	private async handleOnReturn(message: LiMessage): Promise<void> {

		LiLogger.log(`Message (${message.id}) is a response.`);

		const handler: LiMessageHandler | undefined = this.messageManager.getHandler(message.id);
		if (handler === undefined) {
			LiLogger.error("LiBaseSocket.handleOnReturn(): Handler not found for message id.");
			return;
		}

		handler(message);

	}

	public implement<C extends LiCommandName<LocalCommands>>(command: C, handler: LiCommandHandlerStructure<LocalCommands, RemoteCommands, C>): void {
		this.commandRegistry.implement(command, handler);
	}

	public invoke<C extends LiCommandName<RemoteCommands>>(command: C, param: LiCommandHandlerParam<RemoteCommands, C>): LiCommandHandlerReturn<RemoteCommands, C> {
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
				timestamp: Date.now()
			}).catch((err: any): void => {

				console.error("LiBaseSocket.invoke:send Failed to send.");
				console.error(err);

			});

		});
	}

}