/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */
import {LiBaseSocket} from "./LiBaseSocket";

export type LiCommandRegistryCommand<P = any, R = any> = {
	param: P;
	return: R;
};

export type LiCommandRegistryStructure<T extends object = object> = {
	[key in keyof T]: LiCommandRegistryCommand;
};

export type LiCommandHandler = (value: any, socket: LiBaseSocket<any, any>) => Promise<any>;

export type LiCommandName<T extends LiCommandRegistryStructure> = (keyof T) & string;
export type LiCommand<T extends LiCommandRegistryStructure, C extends LiCommandName<T>> = T[C];
export type LiCommandHandlerParam<T extends LiCommandRegistryStructure<T>, C extends LiCommandName<T>> = LiCommand<T, C>["param"];
export type LiCommandHandlerReturn<T extends LiCommandRegistryStructure<T>, C extends LiCommandName<T>> = Promise<LiCommand<T, C>["return"]>;

export type LiCommandHandlerStructure<LC extends LiCommandRegistryStructure<LC>, RC extends LiCommandRegistryStructure<RC>, C extends LiCommandName<LC>> = (value: LiCommandHandlerParam<LC, C>, socket: LiBaseSocket<RC, LC>) => LiCommandHandlerReturn<LC, C>;

export class LiCommandRegistry<T extends LiCommandRegistryStructure<T>> {

	private commands: Map<string, LiCommandHandler>;

	public constructor() {

		this.commands = new Map<string, LiCommandHandler>();

	}

	public implement<C extends LiCommandName<T>>(command: C, handler: LiCommandHandlerStructure<T, any, C>): void {

		this.commands.set(command, handler);

	}

	public getHandlerForCommand(command: string): LiCommandHandler | undefined {

		return this.commands.get(command);

	}

}