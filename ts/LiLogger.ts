/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */
import {BetterJSON} from "@elijahjcobb/better-json";

export class LiLogger {

	private static enabled: boolean = false;

	public static log(msg: string): void {

		if (typeof msg === "object") msg = BetterJSON.stringify(msg);
		console.log("LiLogger: " + msg);

	}

	public static error(msg: string): void {

		if (typeof msg === "object") msg = BetterJSON.stringify(msg);
		console.error("LiLogger: " + msg);

	}

	public static enable(): void { this.enabled = true; }
	public static disable(): void { this.enabled = false; }
}