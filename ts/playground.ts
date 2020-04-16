/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiCommandRegistryStructure, LiSocket} from "./index";
import {LiServer} from "./LiServer";

interface LocalCommandSet extends LiCommandRegistryStructure {
	hello: {
		param: string;
		return: string;
	};
}

interface RemoteCommandSet extends LiCommandRegistryStructure {
	birthday: {
		param: { age: number, name: string };
		return: number;
	};
}

(async(): Promise<void> => {

	const socket: LiSocket<LocalCommandSet, RemoteCommandSet> = await LiSocket.init("");
	socket.implement("hello", async(name: string): Promise<string> => {

		return `Hello to you to ${name}!`;

	});
	await socket.invoke("birthday", {age: 2, name: "Elijah"});

	const server: LiServer<RemoteCommandSet, LocalCommandSet> = new LiServer(8080);
	server.implement("birthday", async(param: {age: number, name: string}): Promise<number> => {
		return param.age + 1;
	});
	server.invoke("id", "hello", "Elijah");

})();