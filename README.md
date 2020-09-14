Welcome to the lithium wiki! This is a work in progress and will be constantly updated. Below you will find pages to
this wiki but also feel free to view some nice features and information about the package.

## Wiki
To view the rest of the wiki, please visit [here](https://github.com/element-ts/lithium/wiki).

## Summary
Lithium is a Typescript package available on NPM as a part of the [@elemen-ts](https://element-ts.com) organization.
It provides a simple yet very in depth medium of sending requests between clients and a server. It is all type safe
only allowing invocation of implemented methods and requiring the parameters and return types are correct. Lithium also
allows for peer-to-peer function invocation creating a network that is routed through a central server.

## Example

#### Shared
You can make a shared package that contains the type definitions for what commands your websockets will implement.

`commands.ts`
```typescript
import {LiCommandRegistryStructure} from "@element-ts/lithium";

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
```

#### Server
`server.ts`
```typescript
import {LiServer} from "@element-ts/lithium";
import {MyClientCommands, MyServerCommands} from "./playground-types";

const server: LiServer<MyServerCommands, MyClientCommands> = new LiServer({
    port: 8080,
    debug: true
});

let favoriteNumber: number = 42;

server.implement("getFavoriteColor", async(): Promise<number> => {
    return favoriteNumber;
});

server.implement("changeFavoriteNumber", async(num: number): Promise<void> => {
    favoriteNumber = num;
    await server.broadcast("favoriteNumberChanged", favoriteNumber);
});
```

#### Client
`client.ts`
```typescript
import {LiNodeSocket} from "@element-ts/lithium";
import {MyServerCommands, MyClientCommands} from "./playground-types";

const socket: LiNodeSocket<MyClientCommands, MyServerCommands> = await LiNodeSocket.init({
    address: "ws://localhost:8080",
    debug: true
});

socket.implement("favoriteNumberChanged", async(num: number): Promise<void> => {
    console.log(`Favorite number is now: ${num}!`);
    await socket.invoke("changeFavoriteNumber", num + 1);
});

await socket.invoke("changeFavoriteNumber", 0);
```

## Features

### Implement/Invoke
Once you have a `LiCommandRegistryStructure`
([view docs on 'Command Registry'](https://github.com/element-ts/lithium/wiki/CommandRegistry)) set up you can
simply `implement()` and `invoke()` the commands on both the clients and central server. These are type
checked off of your command registry and will make sure you not only are talking about a command that exists, but you
are providing the correct parameters and expecting the correct return type.

### Async
Everything is written with promises so that you don't have to worry about the messy stuff underneath the scenes. If
you are interested you can view the page on the
[underlying protocol](https://github.com/element-ts/lithium/wiki/Protocol) that messages are sent via.

### Typesafe
If you try to implement/invoke a method with the incorrect command name, parameter, or return value TypeScript will
throw a compile time error. Whenever you are using lithium you will always know you are using the right types!

If you are interested in looking at the types that make Lithium work you can view the source code for them in the
[`LiCommandRegistry.ts` file found here](https://github.com/element-ts/lithium/blob/master/ts/LiCommandRegistry.ts).

### Broadcast
The server can broadcast the invoking of a command to all clients and coalesce the returned messages together in a
mapping in parallel where you get an object that follows the type `{[socketId: string]: T | undefined }` where `T` is
the type the command returns. There is a possibility of `undefined` because instead of using `Promise.all()`, it uses
a custom promise handler that will not reject if a client throws an error, it will just make the resulting return
undefined for that singular client in the map. I think this makes most sense for the use of broadcasting.

You can read more about broadcasts on the
[broadcast](https://github.com/element-ts/lithium/wiki/Broadcast) page.

### Peer-To-Peer
Another cool feature built into lithium is peer-to-peer command invocation. A `LiNodeSocket` actually takes three type
parameters. The third is `SC` which stands for _'Sibling Commands'_ and follows the same `LiCommandRegistryStructure`.
Once `SC` is provided to a `LiNodeSocket`, you can access the `implementSibling()` and `invokeSibling()` methods. These
allow a client to talk to another client. To allow for peer-to-peer, when initializing a `LiNodeSocket` you must set the
`allowPeerToPeer` property to `true` in the config object. If you provide an sibling command but do not set the socket
to allow peer-to-peer the socket will respond as if the command does not exist.

You can read more about peer-to-peer command invoking on the
[peer-to-peer](https://github.com/element-ts/lithium/wiki/PeerToPeer) page.

## Protocol
... coming soon

## About

### Language
All of Lithium is written in [TypeScript](https://www.typescriptlang.org). If you do not know how to use TypeScript don't worry. It is completely compatible with JavaScript.

### Why?
I wanted a really easy way to handle web-sockets in my projects and had some free time due to Covid-19.

### Author/Maintainer
My name is [Elijah Cobb](https://elijahcobb.com). I am a computer science student at [Michigan Technological University](https://mtu.edu).
