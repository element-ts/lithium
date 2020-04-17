/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */
import {LiBaseSocket} from "./LiBaseSocket";
import {
	LiCommandHandlerStructure,
	LiCommandName, LiCommandRegistry,
	LiCommandRegistryStructure
} from "./LiCommandRegistry";

import {PromResolve, PromReject} from "@elijahjcobb/prom-type";
import * as WS from "ws";
import {LiLogger} from "./LiLogger";

export interface LiSocketConfig {
	address: string;
	debug: boolean;
}

export class LiSocket<LocalCommands extends LiCommandRegistryStructure, RemoteCommands extends LiCommandRegistryStructure> extends LiBaseSocket<LocalCommands, RemoteCommands> {

	private constructor(config: LiSocketConfig, ws: WS) {

		super(ws);

	}

	public static init<LocalCommands extends LiCommandRegistryStructure, RemoteCommands extends LiCommandRegistryStructure>(config: LiSocketConfig): Promise<LiSocket<LocalCommands, RemoteCommands>> {

		if (config.debug) LiLogger.enable();

		return new Promise((resolve: PromResolve<LiSocket<LocalCommands, RemoteCommands>>, reject: PromReject): void => {

			LiLogger.log(`Preparing to open new socket to: '${config.address}'.`);

			const ws: WS = new WS(config.address);

			LiLogger.log(`Waiting to open new socket with: '${config.address}'.`);

			ws.on("open", (): void => {

				LiLogger.log(`Did open new socket with: '${config.address}'.`);

				const socket: LiSocket<LocalCommands, RemoteCommands> = new LiSocket(config, ws);

				LiLogger.log(`Did create LiSocket instance from WS socket.`);

				resolve(socket);

			});

		});

	}

}