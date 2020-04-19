/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiBaseSocket, LiCommandRegistryStructure, LiServer, LiSocket} from "../index";
import {PlaygroundClientCommands} from "./playground-client";
import * as Crypto from "crypto";

export interface PlaygroundServerCommands extends LiCommandRegistryStructure {
	handleBuffer: {
		param: Buffer;
		return: Buffer;
	};
	handleString: {
		param: string;
		return: string;
	};
	handleNum: {
		param: number;
		return: number;
	};
	handleBoo: {
		param: boolean;
		return: boolean;
	};
	handleArray: {
		param: number[];
		return: number;
	};
	handleObject: {
		param: { name: string, age: number };
		return: { msg: string };
	};
	handleNestedObject: {
		param: {
			name: string,
			address: { street: string, zip: number}
		};
		return: string
	};
	handleNestedBuffer: {
		param: {
			email: string;
			salt: Buffer;
		};
		return: {email: string, salt: Buffer};
	};
	handleVoid: {
		param: void;
		return: void;
	};
	handleError: {
		param: void;
		return: void;
	};
	handleThrow: {
		param: void;
		return: void;
	};
}

(async (): Promise<void> => {

	const server: LiServer<PlaygroundServerCommands, PlaygroundClientCommands> = new LiServer({
		port: 8080,
		debug: true
	});

	server.implement("handleBuffer", async(param: Buffer): Promise<Buffer> => {

		return Buffer.concat([Buffer.from("Hello, world! "), param, Buffer.from(" Hello, world!")]);

	});

	server.implement("handleNum", async(param: number): Promise<number> => {

		return param * param;

	});

	server.implement("handleBoo", async(param: boolean): Promise<boolean> => {

		return !param;

	});

	server.implement("handleString", async(param: string): Promise<string> => {

		return `Well hello, ${param}!`;

	});

	server.implement("handleArray", async(param: number[]): Promise<number> => {

		let biggest: number = 0;
		for (const num of param) { if (num > biggest) biggest = num; }

		return biggest;

	});

	server.implement("handleObject", async(param: {name: string, age: number}): Promise<{msg: string}> => {

		return {
			msg: `Hello ${param.name}, you are ${param.age} years old.`
		};

	});

	server.implement("handleNestedObject", async(param: {name: string, address: { street: string, zip: number }}): Promise<string> => {

		return `Hello ${param.name}, you live in ${param.address.zip} on ${param.address.street}.`;

	});

	server.implement("handleNestedBuffer", async(param: {email: string, salt: Buffer}): Promise<{email: string, salt: Buffer}> => {

		param.email = "no no no";

		console.log(param.salt);

		return param;

	});

	server.implement("handleVoid", async(): Promise<void> => {

		console.log("Handle VOID CALLED!!!!!!");

	});

	server.implement("handleError", async(): Promise<void> => {
		throw new Error("You sucks!!!");
	});

	server.implement("handleThrow", async(): Promise<void> => {
		throw { name: "Elijah", error: "bye bye!"};
	});

	let i: number = 1;

	setInterval(async(): Promise<void> => {
		await server.broadcast("notify", `loop ${i}`);
		i++;
	}, 2000);


})().catch((err: any): void => console.error(err));