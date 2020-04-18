/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiSocket} from "./index";
import {ClientCommandSet, ServerCommandSet} from "./playground-types";

(async(): Promise<void> => {

	const socket: LiSocket<ClientCommandSet, ServerCommandSet> = await LiSocket.init({ address: "ws://localhost:8080", debug: true});

	socket.implement("hello", async(name: string): Promise<string> => {

		console.log("got hello command with name: " + name);

		setTimeout(async(): Promise<void> => {

			console.log(await socket.invoke("end", undefined));

		}, 1000);

		return `Hello to you to ${name}!`;

	});

	socket.implement("end", async(): Promise<void> => {

		console.log("Its the end of the world as we know it.");

	});

	await socket.invoke("birthday", {age: 2, name: "Elijah"});

})();