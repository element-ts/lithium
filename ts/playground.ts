/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiCommandRegistryStructure, LiServer, LiSocket} from "./index";
import * as Crypto from "crypto";

interface ServerCommands extends LiCommandRegistryStructure {
	pow: {
		param: number;
		return: number;
	};
	rand: {
		param: number;
		return: Buffer;
	};
}

interface ClientCommands extends LiCommandRegistryStructure {

}

const server: LiServer<ServerCommands, ClientCommands> = new LiServer({port: 8080, debug: true});

server.implement("num", async(param: number): Promise<number> => {

	return param * param;

});

server.implement("rand", async(param: number): Promise<Buffer> => {

	return Crypto.randomBytes(param);

});