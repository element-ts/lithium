/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {
	LiCommandHandlerParam, LiCommandHandlerReturn, LiCommandHandlerReturnPromisified,
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
import {PromReject, PromResolve} from "@elijahjcobb/prom-type";

export interface LiServerConfig {
	debug?: boolean;
	port: number;
}

export class LiServer<LC extends LiCommandRegistryStructure<LC>, RC extends LiCommandRegistryStructure<RC>> {

	private server: WS.Server;
	private sockets: Map<string, LiBaseSocket<any, any, any>>;
	private readonly commandRegistry: LiCommandRegistry<LC>;
	public onSocketClose: ((socket: LiBaseSocket<RC, LC>) => void) | undefined;
	public onSocketOpen: ((socket: LiBaseSocket<RC, LC>, req: HTTP.IncomingMessage) => Promise<void>) | undefined;

	public constructor(config: LiServerConfig) {

		if (config.debug) LiLogger.enable();

		this.commandRegistry = new LiCommandRegistry();
		this.server = new WS.Server({port: config.port});
		this.sockets = new Map<string, LiBaseSocket<any, any>>();

		this.handlePeerToPeerSetup();

		this.handleNewConnection = this.handleNewConnection.bind(this);
		this.server.on("connection", this.handleNewConnection);


	}

	private handlePeerToPeerSetup(): void {

		// @ts-ignore
		this.implement("invokeSibling", async(param: { param: any, id: string, command: LiCommandName<RC>}): Promise<any> => {

			return this.invoke(param.id, param.command, param.param, true);

		});
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
		if (this.onSocketOpen) this.onSocketOpen(socket, req).catch((err: any): void => LiLogger.error(err));

	}

	public getSockets(): IterableIterator<LiBaseSocket<LC, RC>> {

		return this.sockets.values();

	}

	public broadcast<C extends LiCommandName<RC>>(command: C, param: LiCommandHandlerParam<RC, C>): Promise<{[socketId: string]: LiCommandHandlerReturn<RC, C> | undefined}> {
		return new Promise((resolve: PromResolve<{[socketId: string]: LiCommandHandlerReturn<RC, C> | undefined}>): void => {

			const map: {[socketId: string]: LiCommandHandlerReturn<RC, C> | undefined} = {};
			let count: number = this.connectionCount();

			function handler(socket: LiBaseSocket<LC, RC>, returnValue?: LiCommandHandlerReturn<RC, C>): void {
				count--;
				map[socket.getId()] = returnValue;
				if (count === 0) return resolve(map);
			}

			for (const socket of this.getSockets()) {
				socket.invoke(command, param)
					.then((returnValue: LiCommandHandlerReturn<RC, C>): void => handler(socket, returnValue))
					.catch((err: any): void => {
						LiLogger.error(err);
						handler(socket);
					});
			}

		});
	}

	public implement<C extends LiCommandName<LC>>(command: C, handler: LiCommandHandlerStructure<LC, RC, C>): void {
		this.commandRegistry.implement(command, handler, true);
	}

	public invoke<C extends LiCommandName<RC>>(id: string, command: C, param: LiCommandHandlerParam<RC, C>, peerToPeer: boolean = false): LiCommandHandlerReturnPromisified<RC, C> | undefined {
		return this.getSocket(id)?.invoke(command, param, peerToPeer);
	}

	public getSocket(id: string): LiBaseSocket<LC, RC> | undefined {

		return this.sockets.get(id);

	}

	public connectionCount(): number {

		return this.sockets.size;

	}

}

