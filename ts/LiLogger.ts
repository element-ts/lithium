/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

export class LiLogger {

	private static enabled: boolean = false;

	public static log(msg: string): void {

		console.log("LiLogger: " + msg);

	}

	public static error(msg: string): void {

		console.error("LiLogger: " + msg);

	}

	public static enable(): void { this.enabled = true; }
	public static disable(): void { this.enabled = false; }
}