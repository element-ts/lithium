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
import {Neon} from "@element-ts/neon";

export interface LiSocketConfig {
	address: string;
	debug?: boolean;
	bearer?: string;
	allowPeerToPeer?: boolean;
}

export class LiSocket<
	LC extends LiCommandRegistryStructure<LC>,
	RC extends LiCommandRegistryStructure<RC>,
	SC extends LiCommandRegistryStructure<SC> = any
> extends LiBaseSocket<LC, RC, SC> {

	private constructor(config: LiSocketConfig, ws: WS, didReceiveId: () => void) {

		if (config.debug) Neon.enable();
		Neon.setTitle("@element-ts/lithium LiSocket");

		super(ws, undefined, "", didReceiveId, config.allowPeerToPeer);

	}

	public async invokeSibling<C extends LiCommandName<SC>>(id: string, command: C, param: LiCommandHandlerParam<SC, C>): Promise<LiCommandHandlerReturn<SC, C> | undefined> {

		// @ts-ignore
		return await this.invoke("invokeSibling", {param, id, command});

	}

	public static init<LC extends LiCommandRegistryStructure<LC>, RC extends LiCommandRegistryStructure<RC>, SC extends LiCommandRegistryStructure<SC> = any>(config: LiSocketConfig): Promise<LiSocket<LC, RC, SC>> {

		if (config.debug) Neon.enable();

		return new Promise((resolve: PromResolve<LiSocket<LC, RC, SC>>, reject: PromReject): void => {

			Neon.log(`Preparing to open new socket to: '${config.address}'.`);

			const ws: WS = new WS(config.address, {
				headers: {
					authorization: config.bearer ?? "",
				}
			});

			Neon.log(`Waiting to open new socket with: '${config.address}'.`);

			ws.on("open", (): void => {

				Neon.log(`Did open new socket with: '${config.address}'.`);

				Neon.log("Waiting for my id.");

				const socket: LiSocket<LC, RC, SC> = new LiSocket(config, ws, (): void => {
					Neon.log(`Did receive my id: ${socket.getId()}.`);
					resolve(socket);
				});

				Neon.log(`Did create LiSocket instance from WS socket.`);


			});

		});

	}

}