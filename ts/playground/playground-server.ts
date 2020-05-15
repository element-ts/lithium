/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiServer} from "../index";
import {MyClientCommands, MyServerCommands} from "./playground-types";

const server: LiServer<MyServerCommands, MyClientCommands> = new LiServer({
	port: 8080,
	debug: true
});

let favoriteNumber: number = 42;

server.implement("getFavoriteColor", async(): Promise<number> => {

	return favoriteNumber;

});

server.implement("changeFavoriteNumber", async(num: number): Promise<void> => {

	favoriteNumber = num;
	await server.broadcast("favoriteNumberChanged", favoriteNumber);

});