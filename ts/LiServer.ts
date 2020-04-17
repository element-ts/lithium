/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {
	LiCommandHandlerParam, LiCommandHandlerReturn,
	LiCommandHandlerStructure,
	LiCommandName,
	LiCommandRegistry,
	LiCommandRegistryStructure
} from "./LiCommandRegistry";

import {LiBaseSocket} from "./LiBaseSocket";
import * as WS from "ws";
import * as Crypto from "crypto";
import {LiLogger} from "./LiLogger";

export interface LiServerConfig {
	debug: boolean;
	port: number;
}

export class LiServer<LocalCommands extends LiCommandRegistryStructure, RemoteCommands extends LiCommandRegistryStructure> {

	private server: WS.Server;
	private sockets: Map<string, LiBaseSocket<any, any>>;
	private readonly commandRegistry: LiCommandRegistry<LocalCommands>;

	public constructor(config: LiServerConfig) {

		if (config.debug) LiLogger.enable();

		this.commandRegistry = new LiCommandRegistry();
		this.server = new WS.Server({port: config.port});
		this.sockets = new Map<string, LiBaseSocket<any, any>>();

		this.handleNewConnection = this.handleNewConnection.bind(this);
		this.server.on("connection", this.handleNewConnection);

	}

	private handleNewConnection(ws: WS): void {

		LiLogger.log(`Did receive new connection.`);

		let id: string = Crypto.randomBytes(16).toString("hex");
		while (this.sockets.has(id)) id = Crypto.randomBytes(16).toString("hex");

		const socket: LiBaseSocket<any, any> = new LiBaseSocket(ws, this.commandRegistry, id);
		this.sockets.set(id, socket);

	}

	public getSockets(): IterableIterator<LiBaseSocket<RemoteCommands, LocalCommands>> {

		return this.sockets.values();

	}

	public implement<C extends LiCommandName<LocalCommands>>(command: C, handler: LiCommandHandlerStructure<LocalCommands, RemoteCommands, C>): void {
		this.commandRegistry.implement(command, handler);
	}

	public invoke<C extends LiCommandName<RemoteCommands>>(id: string, command: C, param: LiCommandHandlerParam<RemoteCommands, C>): LiCommandHandlerReturn<RemoteCommands, C> | undefined {
		return this.getSocket(id)?.invoke(command, param);
	}

	public getSocket(id: string): LiBaseSocket<LocalCommands, RemoteCommands> | undefined {

		return this.sockets.get(id);

	}

}

