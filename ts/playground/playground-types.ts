/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiCommandRegistryStructure} from "../core/LiCommandRegistry";

export interface MyServerCommands extends LiCommandRegistryStructure {
	changeFavoriteNumber: {
		param: number;
		return: void;
	};
	getFavoriteColor: {
		param: void;
		return: number;
	};
}

export interface MyClientCommands extends LiCommandRegistryStructure {
	favoriteNumberChanged: {
		param: number;
		return: void;
	};
}