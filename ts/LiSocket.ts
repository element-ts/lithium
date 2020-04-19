/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */
import {LiBaseSocket} from "./LiBaseSocket";
import {
	LiCommandHandlerParam, LiCommandHandlerReturn,
	LiCommandHandlerReturnPromisified,
	LiCommandName,
	LiCommandRegistryStructure
} from "./LiCommandRegistry";
import {PromResolve, PromReject} from "@elijahjcobb/prom-type";
import * as WS from "ws";
import {LiLogger} from "./LiLogger";

export interface LiSocketConfig {
	address: string;
	debug?: boolean;
	bearer?: string;
}

export class LiSocket<LC extends LiCommandRegistryStructure<LC>, RC extends LiCommandRegistryStructure<RC>> extends LiBaseSocket<LC, RC> {

	private constructor(config: LiSocketConfig, ws: WS, didReceiveId: () => void) {

		super(ws, undefined, "", didReceiveId);

	}

	public async invokeSibling<C extends LiCommandName<LC>>(id: string, command: C, param: LiCommandHandlerParam<LC, C>): Promise<LiCommandHandlerReturn<LC, C> | undefined> {

		// @ts-ignore
		return await this.invoke("invokeSibling", {param, id, command});

	}

	public static init<LocalCommands extends LiCommandRegistryStructure<LocalCommands>, RemoteCommands extends LiCommandRegistryStructure<RemoteCommands>>(config: LiSocketConfig): Promise<LiSocket<LocalCommands, RemoteCommands>> {

		if (config.debug) LiLogger.enable();

		return new Promise((resolve: PromResolve<LiSocket<LocalCommands, RemoteCommands>>, reject: PromReject): void => {

			LiLogger.log(`Preparing to open new socket to: '${config.address}'.`);

			const ws: WS = new WS(config.address, {
				headers: {
					authorization: config.bearer ?? "",
				}
			});

			LiLogger.log(`Waiting to open new socket with: '${config.address}'.`);

			ws.on("open", (): void => {

				LiLogger.log(`Did open new socket with: '${config.address}'.`);

				LiLogger.log("Waiting for my id.");

				const socket: LiSocket<LocalCommands, RemoteCommands> = new LiSocket(config, ws, (): void => {
					LiLogger.log(`Did receive my id: ${socket.getId()}.`);
					resolve(socket);
				});

				LiLogger.log(`Did create LiSocket instance from WS socket.`);


			});

		});

	}

}