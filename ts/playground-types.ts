/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiCommandRegistryStructure} from "./index";

export interface ClientCommandSet extends LiCommandRegistryStructure {
	hello: {
		param: string;
		return: string;
	};
	end: {
		param: void;
		return: void;
	};
}

export interface ServerCommandSet extends LiCommandRegistryStructure {
	birthday: {
		param: { age: number, name: string };
		return: number;
	};
	end: {
		param: void;
		return: string;
	};
}