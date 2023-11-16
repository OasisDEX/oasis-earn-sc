# Summer CLI

This is simple cli to automate common tasks on tenderly forks. To start you need to populate `.env` with required fields: `WALLET`, `RPC`.

## Usage

Before running make sure that typings in `/abis` are generated, if not go to the package and run `typechain`.

To use cli run

```
yarn cli <command-name> <command-arguments>
e.g.
$ yarn cli get-tokens token=eth amount=1
```

To check avaiable commands run

```
$ yarn cli
```

## Development

To implement new command create new file inside `/src/commands`. You will need to export object that follows Command interface

```
interface Command {
    name: string;
    description: string,
    run(args: Args, enviroment: Enviroment): Promise<void>;
    args: ArgsSchema;
}
```

The command `name` will be used to identify command by cli (please watchout for name conflicts)

The `description` will be displayed in help

`run` is actuall logic of the command, passed args are parsed and validated before invking run.

`args` is yup schema for parsing and validation of the arguments.

## How to

- Add new supported token:

In `utils./tokens.ts` add new token to tokens array, then typescript should hightlight all palces where you will miss data, like decimals.

## Missings stuff

- [] Help displayed when command not found or wrong params
- [] Autocomplete
