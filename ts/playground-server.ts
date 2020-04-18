/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiBaseSocket, LiServer} from "./index";
import {ClientCommandSet, ServerCommandSet} from "./playground-types";
import * as HTTP from "http";

(async(): Promise<void> => {

	const server: LiServer<ServerCommandSet, ClientCommandSet> = new LiServer({port: 8080, debug: true});

	server.implement("birthday", async (param: { age: number, name: string }, socket: LiBaseSocket<ClientCommandSet, ServerCommandSet>): Promise<number> => {

		console.log("got birthday command with param:");
		console.log(param);
		await socket.invoke("hello", param.name);
		return 21;

	});

	server.implement("end", async(param: void, socket: LiBaseSocket<ClientCommandSet, ServerCommandSet>): Promise<string> => {

		console.log("END CALLED!");

		await socket.invoke("end", undefined);

		return "end";

	});

	server.onSocketOpen = (socket: LiBaseSocket<ClientCommandSet, ServerCommandSet>, req: HTTP.IncomingMessage): void => {

		console.log("HELLO HELLO HELLO!!! to: " + socket.id);
		socket.close();

	};

})();