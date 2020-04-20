/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiCommandRegistryStructure, LiSocket} from "../index";
import {PlaygroundServerCommands} from "./playground-server";

export interface PlaygroundClientCommands extends LiCommandRegistryStructure {
	// notify: {
	// 	param: string;
	// 	return: void;
	// };
	peerMessageDeny: {
		param: void;
		return: void;
	};
	newSibling: {
		param: string;
		return: void;
	};
}

export interface PlaygroundClientSiblingCommands extends LiCommandRegistryStructure {
	// notify: {
	// 	param: string;
	// 	return: void;
	// };
	peerMessageAllow: {
		param: void;
		return: void;
	};
}

(async (): Promise<void> => {

	const socket: LiSocket<PlaygroundClientCommands, PlaygroundServerCommands, PlaygroundClientSiblingCommands> = await LiSocket.init({
		address: "ws://localhost:8080",
		debug: true,
		allowPeerToPeer: false
	});

	socket.implementSibling("peerMessageAllow", async(): Promise<void> => {


		console.log("Peer message allowed!");

	});

	socket.implement("peerMessageDeny", async(): Promise<void> => {

		console.log("Peer message denied!");

	});

	socket.implement("newSibling", async (siblingId: string): Promise<void> => {

		await socket.invokeSibling(siblingId, "peerMessageAllow", undefined);

	});

	// socket.implement("notify", async(msg: string): Promise<void> => {
	//
	// 	console.log(msg);
	//
	// });
	//
	// await socket.invokeSibling("xx", "notify", "fewwfe");
	//
	// try {
	// 	await socket.invoke("handleError", undefined);
	// } catch (e) {
	// 	console.log(e);
	// }
	//
	// try {
	// 	await socket.invoke("handleThrow", undefined);
	// } catch (e) {
	// 	console.log(e);
	// }
	//
	// const bufferBefore: Buffer = Buffer.from("message!!!");
	// console.log(bufferBefore.toString("utf8"));
	// const bufferAfter: Buffer = await socket.invoke("handleBuffer", bufferBefore);
	// console.log(bufferAfter.toString("utf8"));
	//
	// const numBefore: number = 3;
	// console.log(numBefore);
	// const numAfter: number = await socket.invoke("handleNum", numBefore);
	// console.log(numAfter);
	//
	// const booBefore: boolean = true;
	// console.log(booBefore);
	// const booAfter: boolean = await socket.invoke("handleBoo", booBefore);
	// console.log(booAfter);
	//
	// const strBefore: string = "Elijah";
	// console.log(strBefore);
	// const strAfter: string = await socket.invoke("handleString", strBefore);
	// console.log(strAfter);
	//
	// const arrBefore: number[] = [1, 2, 3, 4, 5, 2, 3, 9, 2, 1, 4, 8, 3, 1];
	// console.log(arrBefore);
	// const arrAfter: number = await socket.invoke("handleArray", arrBefore);
	// console.log(arrAfter);
	//
	// const objBefore: {name: string, age: number} = { name: "Elijah", age: 21 };
	// console.log(objBefore);
	// const objAfter: { msg: string } = await socket.invoke("handleObject", objBefore);
	// console.log(objAfter);
	//
	// const objNestedBefore: {name: string, address: {street: string, zip: number}} = { name: "Elijah", address: { street: "Front Street", zip: 49696 } };
	// console.log(objNestedBefore);
	// const objNestedAfter: string = await socket.invoke("handleNestedObject", objNestedBefore);
	// console.log(objNestedAfter);
	//
	// const nestedBufferBefore: {email: string, salt: Buffer} = { email: "elijah@elijahcobb.com", salt: Buffer.from("Hello, world!") };
	// console.log(nestedBufferBefore);
	// const nestedBufferAfter: {email: string, salt: Buffer} = await socket.invoke("handleNestedBuffer", nestedBufferBefore);
	// console.log(nestedBufferAfter);
	//
	// await socket.invoke("handleVoid", undefined);

})().catch((err: any): void => console.error(err));