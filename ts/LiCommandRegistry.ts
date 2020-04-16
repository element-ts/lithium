/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

export type LiCommandRegistryStructure = { [key: string]: { param: any; return: any; }; };
export type LiCommandName<T extends LiCommandRegistryStructure> = keyof T & string;
export type LiCommandHandler = (value: any) => Promise<any>;
export type LiCommandHandlerParam<T extends LiCommandRegistryStructure, C extends LiCommandName<T>> = T[C]["param"];
export type LiCommandHandlerReturn<T extends LiCommandRegistryStructure, C extends LiCommandName<T>> = Promise<T[C]["return"]>;
export type LiCommandHandlerStructure<T extends LiCommandRegistryStructure, C extends LiCommandName<T>> = (value: LiCommandHandlerParam<T, C>) => LiCommandHandlerReturn<T, C>;

export class LiCommandRegistry<T extends LiCommandRegistryStructure> {

	private commands: Map<string, LiCommandHandler>;

	public constructor() {

		this.commands = new Map<string, LiCommandHandler>();

	}

	public implement<C extends LiCommandName<T>>(command: C, handler: LiCommandHandlerStructure<T, C>): void {

		this.commands.set(command, handler);

	}

	public getHandlerForCommand(command: string): LiCommandHandler | undefined {

		return this.commands.get(command);

	}

}