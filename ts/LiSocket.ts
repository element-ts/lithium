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
import WS from "ws";

export class LiSocket<LocalCommands extends LiCommandRegistryStructure, RemoteCommands extends LiCommandRegistryStructure> extends LiBaseSocket<LocalCommands, RemoteCommands> {

	private constructor(ws: WS) {

		super(ws);

	}

	public static init<LocalCommands extends LiCommandRegistryStructure, RemoteCommands extends LiCommandRegistryStructure>(address: string): Promise<LiSocket<LocalCommands, RemoteCommands>> {

		return new Promise((resolve: PromResolve<LiSocket<LocalCommands, RemoteCommands>>, reject: PromReject): void => {

			const ws: WS = new WS(address);

			ws.on("open", (): void => {

				const socket: LiSocket<LocalCommands, RemoteCommands> = new LiSocket(ws);
				resolve(socket);

			});

		});

	}

}