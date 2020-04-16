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
import WS from "ws";
import * as Crypto from "crypto";

export class LiServer<LocalCommands extends LiCommandRegistryStructure, RemoteCommands extends LiCommandRegistryStructure> {

	private server: WS.Server;
	private sockets: Map<string, LiBaseSocket<any, any>>;
	private readonly commandRegistry: LiCommandRegistry<LocalCommands>;

	public constructor(port: number) {

		this.commandRegistry = new LiCommandRegistry();
		this.server = new WS.Server({port});
		this.sockets = new Map<string, LiBaseSocket<any, any>>();
		this.server.on("connection", this.handleNewConnection);

	}

	private handleNewConnection(ws: WS): void {

		let id: string = Crypto.randomBytes(16).toString("hex");
		while (this.sockets.has(id)) id = Crypto.randomBytes(16).toString("hex");

		const socket: LiBaseSocket<any, any> = new LiBaseSocket(ws, this.commandRegistry, id);
		this.sockets.set(id, socket);

	}

	public implement<C extends LiCommandName<LocalCommands>>(command: C, handler: LiCommandHandlerStructure<LocalCommands, C>): void {
		this.commandRegistry.implement(command, handler);
	}

	public invoke<C extends LiCommandName<RemoteCommands>>(id: string, command: C, param: LiCommandHandlerParam<RemoteCommands, C>): LiCommandHandlerReturn<RemoteCommands, C> | undefined {
		return this.getSocket(id)?.invoke(command, param);
	}

	public getSocket(id: string): LiBaseSocket<LocalCommands, RemoteCommands> | undefined {

		return this.sockets.get(id);

	}

}

