/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiSocket} from "../index";
import {MyServerCommands, MyClientCommands} from "./playground-types";

(async (): Promise<void> => {

	const socket: LiSocket<MyClientCommands, MyServerCommands> = await LiSocket.init({
		address: "ws://localhost:8080",
		debug: true,
		allowPeerToPeer: true
	});

	socket.implement("favoriteNumberChanged", async(num: number): Promise<void> => {

		console.log(`Favorite number is now: ${num}!`);
		await socket.invoke("changeFavoriteNumber", num + 1);

	});

	await socket.invoke("changeFavoriteNumber", 0);

})().catch((err: any): void => console.error(err));