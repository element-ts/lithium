/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */


import {
	LiCommandRegistry,
	LiCommandRegistryStructure
} from "..";
import {LiSocket} from "../core/LiSocket";

export class LiWebSocket<
	LC extends LiCommandRegistryStructure<LC>,
	RC extends LiCommandRegistryStructure<RC>,
	SC extends LiCommandRegistryStructure<SC> = any
	> extends LiSocket<LC, RC, SC> {

	public constructor(socket: WebSocket, commandRegistry?: LiCommandRegistry<LC>, id: string = "", onDidReceiveId: ((() => void) | undefined) = undefined, allowPeerToPeer: boolean = false, debug?: boolean) {

		super({
			close: socket.close,
			send: socket.send,
			onMessage: (handler: (data: any) => void): void => {
				socket.onmessage = ((event: MessageEvent) => {
					handler(event.data);
				});
			},
			onError: (handler: (err: Error) => void): void => {
				socket.onerror = ((event: Event) => {
					handler(new Error("An error occurred in socket."));
				});
			},
			onClose: (handler: (code?: number, reason?: string) => void): void => {
				socket.onclose = ((event: CloseEvent) => {
					handler(event.code, event.reason);
				});
			}
		}, commandRegistry, id, onDidReceiveId, allowPeerToPeer, debug);

	}

}