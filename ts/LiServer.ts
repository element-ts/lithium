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
import * as HTTP from "http";

export interface LiServerConfig {
	debug: boolean;
	port: number;
}

export class LiServer<LocalCommands extends LiCommandRegistryStructure, RemoteCommands extends LiCommandRegistryStructure> {

	private server: WS.Server;
	private sockets: Map<string, LiBaseSocket<any, any>>;
	private readonly commandRegistry: LiCommandRegistry<LocalCommands>;
	public onSocketClose: ((socket: LiBaseSocket<RemoteCommands, LocalCommands>) => void) | undefined;
	public onSocketOpen: ((socket: LiBaseSocket<RemoteCommands, LocalCommands>, req: HTTP.IncomingMessage) => void) | undefined;

	public constructor(config: LiServerConfig) {

		if (config.debug) LiLogger.enable();

		this.commandRegistry = new LiCommandRegistry();
		this.server = new WS.Server({port: config.port});
		this.sockets = new Map<string, LiBaseSocket<any, any>>();

		this.handleNewConnection = this.handleNewConnection.bind(this);
		this.server.on("connection", this.handleNewConnection);

	}

	private handleNewConnection(ws: WS, req: HTTP.IncomingMessage): void {

		LiLogger.log(`Did receive new connection from ip: '${req.connection.remoteAddress}'.`);

		let id: string = Crypto.randomBytes(16).toString("hex");
		while (this.sockets.has(id)) id = Crypto.randomBytes(16).toString("hex");

		const socket: LiBaseSocket<any, any> = new LiBaseSocket(ws, this.commandRegistry, id);

		socket.onClose = ((): void => {

			this.sockets.delete(id);
			if (this.onSocketClose) this.onSocketClose(socket);

		});

		this.sockets.set(id, socket);
		if (this.onSocketOpen) this.onSocketOpen(socket, req);

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

