/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiBaseNodeSocket} from "./LiBaseNodeSocket";
import {
	LiCommandHandlerParam, LiCommandHandlerReturn,
	LiCommandName,
	LiCommandRegistryStructure
} from "../core/LiCommandRegistry";
import {PromResolve, PromReject} from "@elijahjcobb/prom-type";
import * as WS from "ws";
import {Neon} from "@element-ts/neon";

export interface LiSocketConfig {
	address: string;
	debug?: boolean;
	bearer?: string;
	allowPeerToPeer?: boolean;
}

export class LiNodeSocket<
	LC extends LiCommandRegistryStructure<LC>,
	RC extends LiCommandRegistryStructure<RC>,
	SC extends LiCommandRegistryStructure<SC> = any
> extends LiBaseNodeSocket<LC, RC, SC> {

	public static logger: Neon = new Neon();

	private constructor(config: LiSocketConfig, ws: WS, didReceiveId: () => void) {

		if (config.debug) {
			LiNodeSocket.logger.enable();
			LiNodeSocket.logger.setTitle("@element-ts/lithium LiNodeSocket");

		}

		super(ws, undefined, "", didReceiveId, config.allowPeerToPeer, config.debug);

	}

	public async invokeSibling<C extends LiCommandName<SC>>(id: string, command: C, param: LiCommandHandlerParam<SC, C>): Promise<LiCommandHandlerReturn<SC, C> | undefined> {

		// @ts-ignore
		return await this.invoke("invokeSibling", {param, id, command});

	}

	public static init<LC extends LiCommandRegistryStructure<LC>, RC extends LiCommandRegistryStructure<RC>, SC extends LiCommandRegistryStructure<SC> = any>(config: LiSocketConfig): Promise<LiNodeSocket<LC, RC, SC>> {

		if (config.debug) LiNodeSocket.logger.enable();

		return new Promise((resolve: PromResolve<LiNodeSocket<LC, RC, SC>>, reject: PromReject): void => {

			LiNodeSocket.logger.log(`Preparing to open new socket to: '${config.address}'.`);

			const ws: WS = new WS(config.address, {
				headers: {
					authorization: config.bearer ?? "",
				}
			});

			LiNodeSocket.logger.log(`Waiting to open new socket with: '${config.address}'.`);

			ws.on("open", (): void => {

				LiNodeSocket.logger.log(`Did open new socket with: '${config.address}'.`);

				LiNodeSocket.logger.log("Waiting for my id.");

				const socket: LiNodeSocket<LC, RC, SC> = new LiNodeSocket(config, ws, (): void => {
					LiNodeSocket.logger.log(`Did receive my id: ${socket.getId()}.`);
					resolve(socket);
				});

				LiNodeSocket.logger.log(`Did create LiSocket instance from WS socket.`);


			});

		});

	}

}