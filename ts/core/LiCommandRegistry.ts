/**
 * Elijah Cobb
 * elijah@elijahcobb.com
 * elijahcobb.com
 * github.com/elijahjcobb
 */

import {LiSocket} from "./LiSocket";

export type LiCommandRegistryCommand<P = any, R = any> = {param: P, return: R};
export type LiCommandRegistryStructure<T extends object = object> = { [key in keyof T]: LiCommandRegistryCommand; };
export type LiCommandHandler = (value: any, socket: LiSocket<any, any>) => Promise<any>;
export type LiCommandName<T extends LiCommandRegistryStructure> = (keyof T) & string;
export type LiCommand<T extends LiCommandRegistryStructure, C extends LiCommandName<T>> = T[C];

export type LiCommandHandlerParam<
	T extends LiCommandRegistryStructure<T>,
	C extends LiCommandName<T>
> = LiCommand<T, C>["param"];


export type LiCommandHandlerReturn<
	T extends LiCommandRegistryStructure<T>,
	C extends LiCommandName<T>
> = LiCommand<T, C>["return"];

export type LiCommandHandlerReturnPromisified<
	T extends LiCommandRegistryStructure<T>,
	C extends LiCommandName<T>
> = Promise<LiCommandHandlerReturn<T, C>>;

export type LiCommandHandlerStructure<
	LC extends LiCommandRegistryStructure<LC>,
	RC extends LiCommandRegistryStructure<RC>,
	C extends LiCommandName<LC>
> = (value: LiCommandHandlerParam<LC, C>, socket: LiSocket<RC, LC>) => LiCommandHandlerReturnPromisified<LC, C>;

export type LiCommandRegistryMapValue = {
	handler: LiCommandHandler;
	allowPeerToPeer: boolean;
};

export class LiCommandRegistry<T extends LiCommandRegistryStructure<T>> {

	private commands: Map<string, LiCommandRegistryMapValue>;

	public constructor() {

		this.commands = new Map<string, LiCommandRegistryMapValue>();

	}

	public implement<C extends LiCommandName<T>>(command: C, handler: LiCommandHandlerStructure<T, any, C>, allowPeerToPeer: boolean): void {

		this.commands.set(command, {handler, allowPeerToPeer});

	}

	public getHandlerForCommand(command: string): LiCommandRegistryMapValue | undefined {

		return this.commands.get(command);

	}

}